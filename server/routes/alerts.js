import { Router } from "express";
import { z } from "zod";
import { getDb } from "../config/database.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const querySchema = z.object({
  acknowledged: z.enum(["true", "false"]).optional(),
  limit: z.coerce.number().int().default(50),
});

router.get("/", authMiddleware, async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query" });
  const params = { limit: parsed.data.limit };
  if (parsed.data.acknowledged !== undefined) {
    params.acknowledged = parsed.data.acknowledged === "true";
  }
  const rows = await getDb().listAlerts(params);
  res.json(rows);
});

router.post("/:id/acknowledge", authMiddleware, async (req, res) => {
  const row = await getDb().acknowledgeAlert(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

export default router;
