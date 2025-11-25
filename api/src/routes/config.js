/**
 * Configuration routes
 */

import { Router } from "express";
import { config } from "../config/index.js";

const router = Router();

router.get("/config/models", (_req, res) => {
  res.json({
    defaultRoute: config.defaultRoute,
    fast: config.modelMetadata.fast,
    slow: config.modelMetadata.slow,
  });
});

export default router;

