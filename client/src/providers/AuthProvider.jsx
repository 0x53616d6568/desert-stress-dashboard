import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getMe } from "@/services/api";

const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState(() => localStorage.getItem("dsm_token"));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    async function hydrateSession() {
      setIsLoading(true);
      const maxRetries = 8;
      try {
        for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
          try {
            const currentUser = await getMe();
            if (!cancelled) {
              setUser(currentUser);
            }
            return;
          } catch (err) {
            const status = err?.status;
            const retryable = status >= 500 || err?.message === "Failed to fetch";

            if (retryable && attempt < maxRetries) {
              const retryDelayMs = Math.min(500 + attempt * 250, 2000);
              await wait(retryDelayMs);
              continue;
            }

            if (cancelled) return;

            if (status === 401 || status === 403) {
              localStorage.removeItem("dsm_token");
              setToken(null);
              setUser(null);
              setLocation("/login");
              return;
            }

            return;
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [token, setLocation]);

  const login = (newToken, nextUser = null) => {
    localStorage.setItem("dsm_token", newToken);
    setToken(newToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("dsm_token");
    setToken(null);
    setUser(null);
    setLocation("/login");
  };

  useEffect(() => {
    if (!token) return;
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => logout(), 15 * 60 * 1000);
    };
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((e) => document.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timeout);
      events.forEach((e) => document.removeEventListener(e, resetTimer));
    };
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
