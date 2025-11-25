/**
 * Input validation middleware
 */

const MAX_PROMPT_LENGTH = 10000;
const MIN_PROMPT_LENGTH = 1;

/**
 * Validates prompt in request body
 */
export function validatePrompt(req, res, next) {
  const { prompt } = req.body;

  if (prompt === undefined || prompt === null) {
    return res.status(400).json({
      error: "Prompt is required",
      code: "MISSING_PROMPT",
    });
  }

  if (typeof prompt !== "string") {
    return res.status(400).json({
      error: "Prompt must be a string",
      code: "INVALID_PROMPT_TYPE",
    });
  }

  if (prompt.length < MIN_PROMPT_LENGTH) {
    return res.status(400).json({
      error: `Prompt must be at least ${MIN_PROMPT_LENGTH} character(s)`,
      code: "PROMPT_TOO_SHORT",
    });
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return res.status(400).json({
      error: `Prompt too long (max ${MAX_PROMPT_LENGTH} characters)`,
      code: "PROMPT_TOO_LONG",
    });
  }

  next();
}

/**
 * Validates route parameter
 */
export function validateRoute(req, res, next) {
  const { which } = req.params;
  const validRoutes = ["a", "b", "auto"];

  if (which && !validRoutes.includes(which.toLowerCase())) {
    return res.status(400).json({
      error: `Invalid route. Must be one of: ${validRoutes.join(", ")}`,
      code: "INVALID_ROUTE",
    });
  }

  next();
}

