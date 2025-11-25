/**
 * Health check routes
 */

import { Router } from "express";
import OllamaService from "../services/ollamaService.js";
import { config } from "../config/index.js";

const router = Router();
const ollamaService = new OllamaService(config);

router.get("/healthz", async (_req, res) => {
  try {
    const models = await ollamaService.getModels();
    res.json({ ok: true, models });
  } catch (e) {
    res.status(503).json({ ok: false, error: e.message });
  }
});

export default router;

