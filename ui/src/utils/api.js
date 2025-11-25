/**
 * API client utilities
 */

import { API_BASE_URL } from "./constants.js";

/**
 * Fetches model configuration from API
 * @returns {Promise<Object>} Model configuration
 */
export async function fetchModelConfig() {
  const res = await fetch(`${API_BASE_URL}/config/models`);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return await res.json();
}

/**
 * Builds options array from config
 * @param {Object} config - Configuration object
 * @returns {Array} Options array
 */
export function buildOptions(config) {
  return [
    {
      value: config.defaultRoute,
      label: `Auto (picks ${config.fast.name} or ${config.slow.name})`,
      description: "Randomly pick either the fast or slow model for each request.",
    },
    {
      value: config.fast.route,
      label: `${config.fast.label} (${config.fast.name})`,
      description: "Faster responses, smaller context window.",
    },
    {
      value: config.slow.route,
      label: `${config.slow.label} (${config.slow.name})`,
      description: "More capable model, slower responses.",
    },
  ];
}

