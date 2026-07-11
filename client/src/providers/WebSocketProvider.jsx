import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, BellRing, Info } from "lucide-react";

const WebSocketContext = createContext({
  isConnected: false,
  lastTelemetry: null,
  lastAlert: null,
});

export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastTelemetry, setLastTelemetry] = useState(null);
  const [lastAlert, setLastAlert] = useState(null);
  const wsRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    let delay = 1000;
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setIsConnected(true);
        delay = 1000;
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "alert") {
            setLastAlert(data.payload);
            const alert = data.payload;
            if (alert.severity === "critical") {
              toast.error(`CRITICAL: ${alert.message}`, { icon: <AlertTriangle className="h-5 w-5 text-destructive" />, duration: 10000 });
            } else if (alert.severity === "warning") {
              toast.warning(`WARNING: ${alert.message}`, { icon: <BellRing className="h-5 w-5 text-amber-500" /> });
            } else {
              toast.info(`INFO: ${alert.message}`, { icon: <Info className="h-5 w-5 text-blue-500" /> });
            }
          } else if (data.type === "telemetry") {
            setLastTelemetry(data.payload);
          }
        } catch (err) {
          console.error("Failed to parse websocket message", err);
        }
      };
      ws.onclose = () => {
        setIsConnected(false);
        timeoutRef.current = setTimeout(() => {
          delay = Math.min(delay * 1.5, 30000);
          connect();
        }, delay);
      };
      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        ws.close();
      };
      wsRef.current = ws;
    };
    connect();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastTelemetry, lastAlert }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => useContext(WebSocketContext);
