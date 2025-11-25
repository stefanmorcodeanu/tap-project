/**
 * Model selection utility
 * Centralizes model selection logic to avoid duplication
 */

import { PROMPT_LENGTH_THRESHOLD } from "./constants.js";

/**
 * Selects the appropriate model based on route and prompt
 * @param {string} route - Route identifier ('a', 'b', or 'auto')
 * @param {string} prompt - User prompt text
 * @param {Object} config - Configuration object with modelA, modelB, and modelMetadata
 * @returns {string} Selected model name
 */
export function selectModel(route, prompt = "", config) {
  const { modelA, modelB, modelMetadata } = config;
  const normalizedRoute = (route || "auto").toLowerCase();

  if (normalizedRoute === modelMetadata.fast.route) {
    return modelA;
  }

  if (normalizedRoute === modelMetadata.slow.route) {
    return modelB;
  }

  // Auto selection: use prompt length as heuristic
  return prompt.length > PROMPT_LENGTH_THRESHOLD ? modelB : modelA;
}

