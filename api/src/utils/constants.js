/**
 * Application constants
 */

// Prompt length threshold for auto model selection
export const PROMPT_LENGTH_THRESHOLD = 220;

// Allowed HTML tags for sanitization
export const ALLOWED_HTML_TAGS = ["b", "i", "p", "br"];

// JSON body size limit
export const JSON_BODY_LIMIT = "1mb";

// Priority fields for extracting text from Ollama responses
export const TEXT_PRIORITY_FIELDS = ["response", "text", "output", "content", "chunk", "message", "delta"];

