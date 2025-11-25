/**
 * Client-side HTML sanitization utility
 * Allows only a small set of tags (b, i, p, br) for safety
 * Also performs a tiny Markdown → HTML conversion for streamed text
 */

const ALLOWED_TAGS = new Set(["B", "I", "P", "BR"]);
const HTML_TAG_RE = /<\/?[a-z][\s\S]*>/i;

function escapeHtmlEntities(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function convertInlineMarkdown(text) {
  if (!text) return "";
  let safe = escapeHtmlEntities(text);
  // Bold first so the italic regex doesn't pick up the double markers
  safe = safe.replace(/(\*\*|__)(.+?)\1/g, "<b>$2</b>");
  safe = safe.replace(/(\*|_)(?!\1)(.+?)\1/g, "<i>$2</i>");
  return safe.replace(/\n/g, "<br />");
}

function markdownToHtml(markdown) {
  const normalized = String(markdown ?? "").replace(/\r\n/g, "\n");
  const blocks = normalized.split(/\n{2,}/);
  const htmlChunks = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    htmlChunks.push(`<p>${convertInlineMarkdown(trimmed)}</p>`);
  }
  if (htmlChunks.length > 0) return htmlChunks.join("");
  return `<p>${convertInlineMarkdown(normalized.trim())}</p>`;
}

/**
 * Sanitizes HTML/Markdown by allowing only specific tags
 * @param {string} input - HTML or Markdown string to sanitize
 * @returns {string} Sanitized HTML string
 */
export function sanitizeSimple(input) {
  const raw = String(input ?? "");
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const source = HTML_TAG_RE.test(trimmed) ? raw : markdownToHtml(raw);

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(source, "text/html");

    function clean(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.cloneNode(true);

      const nodeName = node.nodeName;
      if (!ALLOWED_TAGS.has(nodeName)) {
        // Unwrap children while dropping disallowed tags
        const frag = document.createDocumentFragment();
        for (const child of Array.from(node.childNodes)) {
          const childNode = clean(child);
          if (childNode) frag.appendChild(childNode);
        }
        return frag;
      }

      const el = document.createElement(nodeName.toLowerCase());
      for (const child of Array.from(node.childNodes)) {
        const childNode = clean(child);
        if (childNode) el.appendChild(childNode);
      }
      return el;
    }

    const outFrag = document.createDocumentFragment();
    for (const child of Array.from(doc.body.childNodes)) {
      const cleaned = clean(child);
      if (cleaned) outFrag.appendChild(cleaned);
    }

    const wrapper = document.createElement("div");
    wrapper.appendChild(outFrag);
    return wrapper.innerHTML;
  } catch (e) {
    // Fallback: escape everything to avoid unsafe HTML
    return escapeHtmlEntities(raw);
  }
}
