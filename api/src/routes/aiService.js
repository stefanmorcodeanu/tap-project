/**
 * AI service routes
 * Handles both streaming and non-streaming AI requests
 */

import { Router } from "express";
import { selectModel } from "../utils/modelSelector.js";
import OllamaService from "../services/ollamaService.js";
import { sanitizeModelOutput, escapeHtml, findTextInObj } from "../utils/sanitization.js";
import { setModelHeader } from "../middleware/errorHandler.js";
import { validatePrompt, validateRoute } from "../middleware/validation.js";
import { config } from "../config/index.js";

const router = Router();
const ollamaService = new OllamaService(config);

/**
 * Streaming endpoint: POST /ai-service/:which/stream
 * Proxies Ollama streaming output back to the client
 */
router.post(
  "/ai-service/:which/stream",
  validateRoute,
  validatePrompt,
  async (req, res) => {
    const which = (req.params.which || "auto").toLowerCase();
    const { prompt = "" } = req.body;

    try {
      const model = selectModel(which, prompt, config);
      const modelPrompt = `${config.systemInstruction}\n\n${prompt}`;

      // Set response headers for streaming
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      setModelHeader(res, model);

      // Call Ollama with stream=true
      const stream = await ollamaService.stream(model, modelPrompt);

      // Track whether the client has disconnected so we can stop the Ollama stream
      let clientClosed = false;
      const onClientClose = () => {
        clientClosed = true;
        try {
          // Destroy the upstream stream to cancel work
          if (stream && typeof stream.destroy === "function") stream.destroy();
        } catch (e) {
          // ignore
        }
      };

      req.on("close", onClientClose);
      res.on("close", onClientClose);

      stream.on("data", (chunk) => {
        if (clientClosed) return;
        try {
          const raw = chunk.toString("utf8");
          const lines = raw.split(/\r?\n/);

          for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Strip `data:` prefix if present
            if (line.startsWith("data:")) {
              line = line.slice(5).trim();
            }

            // Try to parse JSON and extract text
            let written = false;
            try {
              const obj = JSON.parse(line);
              const txt = findTextInObj(obj);
              if (txt && String(txt).trim()) {
                res.write(String(txt));
                written = true;
              }
            } catch (e) {
              // Not JSON, continue
            }

            if (!written) {
              // Skip JSON-like lines, forward human-readable text
              if (/^[\[{].*[\]}]$/.test(line) || /"\s*:\s*"/.test(line)) {
                // Skip likely JSON
              } else if (/[a-zA-Z\u00C0-\u024F]/.test(line)) {
                res.write(line);
              }
            }
          }
        } catch (e) {
          // Ignore chunk-level errors
        }
      });


      stream.on("end", () => {
        try {
          if (!res.writableEnded) {
            res.write("\n");
            res.end();
          }
        } catch (e) {
          // ignore
        }
      });

      stream.on("error", (err) => {
        try {
          if (!res.writableEnded) {
            res.write(`\n[stream error] ${escapeHtml(err.message || String(err))}\n`);
            res.end();
          }
        } catch (e) {
          // Keep quiet
        }
      });

      // Ensure we cleanup listeners if the response finishes normally
      const cleanup = () => {
        try {
          req.off && req.off("close", onClientClose);
          res.off && res.off("close", onClientClose);
        } catch (e) {}
      };

      res.on("finish", cleanup);
    } catch (e) {
      res.status(503).json({ error: e.message });
    }
  }
);

/**
 * Non-streaming endpoint: POST /ai-service/:which
 * Returns complete response as JSON
 */
router.post(
  "/ai-service/:which",
  validateRoute,
  validatePrompt,
  async (req, res) => {
    const which = (req.params.which || "auto").toLowerCase();
    const { prompt = "", timeout_ms } = req.body;
    const t0 = Date.now();

    try {
      const model = selectModel(which, prompt, config);
      const modelPrompt = `${config.systemInstruction}\n\n${prompt}`;
      const timeout = timeout_ms ?? config.timeout;

      const output = await ollamaService.generate(model, modelPrompt, timeout);

      setModelHeader(res, model);

      const normalized = sanitizeModelOutput(output);

      res.json({
        route: which,
        model,
        output: normalized,
        latency_ms: Date.now() - t0,
      });
    } catch (e) {
      res.status(503).json({ error: e.message });
    }
  }
);

export default router;

