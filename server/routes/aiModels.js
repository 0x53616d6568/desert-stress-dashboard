import { Router } from "express";
import { z } from "zod";
import { getDb } from "../config/database.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";

const router = Router();

const inputSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  tcoreMae: z.number(),
  stressAuc: z.number(),
  datasetId: z.number().int().nullable().optional(),
  stressThreshold: z.number().nullable().optional(),
  stressProbCritical: z.number().nullable().optional(),
  nEstimators: z.number().int().nullable().optional(),
  maxDepth: z.number().int().nullable().optional(),
});

const updateSchema = inputSchema.partial();

router.get("/", authMiddleware, async (_req, res) => {
  const rows = await getDb().listAiModels();
  res.json(rows);
});

router.get("/:id", authMiddleware, async (req, res) => {
  const row = await getDb().findAiModel(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const parsed = inputSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const row = await getDb().createAiModel(parsed.data);
  res.status(201).json(row);
});

router.patch("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
  const row = await getDb().updateAiModel(req.params.id, parsed.data);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const ok = await getDb().deleteAiModel(req.params.id);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

router.post("/:id/deploy", authMiddleware, adminMiddleware, async (req, res) => {
  const row = await getDb().deployAiModel(req.params.id);
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

export default router;
