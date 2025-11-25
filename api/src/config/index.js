/**
 * Configuration management
 * Validates and exports application configuration
 */

const PORT = Number(process.env.PORT) || 3000;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://ollama:11434";
const MODEL_A = process.env.MODEL_A || "gemma3:1b";
const MODEL_B = process.env.MODEL_B || "llama3.2:3b";
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 120000);
const DEFAULT_ROUTE = "auto";

// Validate required environment variables
if (!OLLAMA_URL) {
  throw new Error("Missing required environment variable: OLLAMA_URL");
}

const MODEL_METADATA = {
  default: DEFAULT_ROUTE,
  fast: { key: "a", route: "a", name: MODEL_A, label: "Fast model" },
  slow: { key: "b", route: "b", name: MODEL_B, label: "Slow model" },
};

// System instruction to guide model outputs
const SYSTEM_INSTRUCTION = `System: Reply in plain text only. Do NOT use Markdown. If you need emphasis, use <b>bold</b> for bold and <i>italic</i> for italic. Do not include backticks, triple-backtick code blocks, or Markdown headings. Keep the response concise.`;

export const config = {
  port: PORT,
  ollamaUrl: OLLAMA_URL,
  modelA: MODEL_A,
  modelB: MODEL_B,
  timeout: OLLAMA_TIMEOUT_MS,
  defaultRoute: DEFAULT_ROUTE,
  modelMetadata: MODEL_METADATA,
  systemInstruction: SYSTEM_INSTRUCTION,
};

