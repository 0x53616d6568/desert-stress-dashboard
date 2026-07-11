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
    if (!token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("dsm_token");
        setToken(null);
        setLocation("/login");
      })
      .finally(() => setIsLoading(false));
  }, [token, setLocation]);

  const login = (newToken) => {
    localStorage.setItem("dsm_token", newToken);
    setToken(newToken);
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
