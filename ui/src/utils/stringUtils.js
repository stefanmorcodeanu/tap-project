/**
 * Pure string utility functions
 */

/**
 * Escapes special regex characters in a string
 * @param {string} s - String to escape
 * @returns {string} Escaped string
 */
export function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Removes trailing model name from text if present
 * @param {string} text - Text to clean
 * @param {string} modelName - Model name to remove
 * @returns {string} Cleaned text
 */
export function removeTrailingModelName(text, modelName) {
  if (!modelName || !text) return text;
  
  try {
    const re = new RegExp(`(?:\\s|\\.|\\,)*${escapeRegExp(modelName)}$`);
    return text.replace(re, "").trim();
  } catch (e) {
    return text;
  }
}

/**
 * Builds routes array based on selected route
 * @param {string} selected - Selected route
 * @param {Object} config - Configuration object
 * @returns {Array<string>} Array of routes to try
 */
export function buildRoutes(selected, config) {
  if (selected === config.defaultRoute) {
    const pick = Math.random() < 0.5 ? config.fast.route : config.slow.route;
    const alt = pick === config.fast.route ? config.slow.route : config.fast.route;
    return [pick, alt];
  }
  return [selected];
}

