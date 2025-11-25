/**
 * HTML sanitization utilities
 */

import sanitizeHtml from "sanitize-html";
import { marked } from "marked";
import { ALLOWED_HTML_TAGS, TEXT_PRIORITY_FIELDS } from "./constants.js";

/**
 * Escapes HTML to prevent injection
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitizes and normalizes HTML output from model
 * Converts Markdown to HTML, sanitizes, and normalizes tags
 * @param {string} raw - Raw model output
 * @returns {string} Sanitized HTML
 */
export function sanitizeModelOutput(raw) {
  const html = marked.parse(String(raw ?? ""));
  const safe = sanitizeHtml(html, {
    allowedTags: ALLOWED_HTML_TAGS,
    allowedAttributes: {},
  });
  
  // Normalize <strong>/<em> to <b>/<i>
  return safe
    .replace(/<strong>/g, "<b>")
    .replace(/<\/strong>/g, "</b>")
    .replace(/<em>/g, "<i>")
    .replace(/<\/em>/g, "</i>");
}

/**
 * Recursively finds text content in Ollama response objects
 * @param {any} obj - Object to search
 * @returns {string|null} Found text content or null
 */
export function findTextInObj(obj) {
  if (!obj) return null;
  if (typeof obj === "string") return obj;
  if (typeof obj === "number") return String(obj);
  
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const v = findTextInObj(item);
      if (v && String(v).trim()) return v;
    }
    return null;
  }
  
  if (typeof obj === "object") {
    for (const k of TEXT_PRIORITY_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        const v = findTextInObj(obj[k]);
        if (v && String(v).trim()) return v;
      }
    }
  }
  
  return null;
}

