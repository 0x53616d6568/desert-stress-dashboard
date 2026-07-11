import jwt from "jsonwebtoken";
import { getDb } from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET or SESSION_SECRET environment variable must be set. " +
      "Use a strong random string (≥32 bytes)."
  );
}

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await getDb().findUserById(payload.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: admin role required" });
  }
  next();
}

export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );
}

export function gatewayAuthMiddleware(req, res, next) {
  const gatewayKey = process.env.GATEWAY_API_KEY;
  if (!gatewayKey) {
    return authMiddleware(req, res, next);
  }
  const provided = req.headers["x-gateway-api-key"] || req.headers["x-api-key"];
  if (provided !== gatewayKey) {
    return res.status(401).json({ error: "Invalid gateway API key" });
  }
  req.user = { role: "gateway" };
  next();
}
