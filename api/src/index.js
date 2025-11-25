/**
 * Main application entry point
 */

import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config/index.js";
import healthRouter from "./routes/health.js";
import configRouter from "./routes/config.js";
import aiServiceRouter from "./routes/aiService.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Routes
app.use("/", healthRouter);
app.use("/", configRouter);
app.use("/", aiServiceRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`API listening on http://0.0.0.0:${config.port}`);
  console.log(
    `MODEL_A=${config.modelA} | MODEL_B=${config.modelB} | OLLAMA=${config.ollamaUrl}`
  );
});
