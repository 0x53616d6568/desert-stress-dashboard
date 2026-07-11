import 'dotenv/config';
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";

import { initDatabase } from "./config/database.js";
import { initWss } from "./ws.js";
import { logger } from "./utils/logger.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";



const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

if (!process.env.JWT_SECRET && !process.env.SESSION_SECRET) {
  logger.error("JWT_SECRET or SESSION_SECRET must be set in the environment");
  process.exit(1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

app.use((req, res, next) => {
  req.log = logger.child({ reqId: req.id || Math.random().toString(36).slice(2) });
  next();
});

app.use("/api", routes);

app.get("/healthz", (req, res) => {
  res.json({ status: "ok", mode: global.db?.mode || "unknown" });
});

app.use(errorHandler);

initWss(server);

async function start() {
  await initDatabase();

  server.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT} in ${NODE_ENV} mode`);
  });
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
