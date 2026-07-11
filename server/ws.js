import { WebSocketServer } from "ws";
import { logger } from "./utils/logger.js";

let wss = null;

export function initWss(server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    logger.info("WebSocket client connected");
    ws.on("close", () => logger.info("WebSocket client disconnected"));
  });

  return wss;
}

export function broadcast(type, payload) {
  if (!wss) return;
  const message = JSON.stringify({ type, payload });
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}
