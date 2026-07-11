import { Router } from "express";
import { z } from "zod";
import { getDb } from "../config/database.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const querySchema = z.object({
  deviceId: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().default(50),
});

router.get("/logs", authMiddleware, async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query" });
  const rows = await getDb().listInferenceLogs(parsed.data);
  res.json(rows);
});

router.get("/health", authMiddleware, async (_req, res) => {
  const health = await getDb().inferenceHealth();
  res.json(health);
});

export default router;
