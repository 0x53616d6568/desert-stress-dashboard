import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import subjectsRouter from "./subjects.js";
import devicesRouter from "./devices.js";
import telemetryRouter from "./telemetry.js";
import alertsRouter from "./alerts.js";
import aiModelsRouter from "./aiModels.js";
import datasetsRouter from "./datasets.js";
import firmwareRouter from "./firmware.js";
import inferenceRouter from "./inference.js";
import dashboardRouter from "./dashboard.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/subjects", subjectsRouter);
router.use("/devices", devicesRouter);
router.use("/telemetry", telemetryRouter);
router.use("/alerts", alertsRouter);
router.use("/ai/models", aiModelsRouter);
router.use("/datasets", datasetsRouter);
router.use("/firmware", firmwareRouter);
router.use("/inference", inferenceRouter);
router.use("/dashboard", dashboardRouter);

export default router;
