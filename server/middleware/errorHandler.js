import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, _next) {
  logger.error({ err, url: req.url, method: req.method }, "Unhandled error");
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
}
