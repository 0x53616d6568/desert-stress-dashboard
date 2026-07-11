import { Router } from "express";
import { getDb } from "../config/database.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/summary", authMiddleware, async (_req, res) => {
  const summary = await getDb().dashboardSummary();
  res.json(summary);
});

router.get("/live-feed", authMiddleware, async (_req, res) => {
  const feed = await getDb().liveFeed();
  res.json(feed);
});

export default router;
