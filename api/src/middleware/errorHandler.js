/**
 * Centralized error handling middleware
 */

/**
 * Standard error handler middleware
 */
export function errorHandler(err, req, res, next) {
  // Log error (in production, use proper logging library)
  console.error("Error:", err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    error: message,
    code: err.code || "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
    path: req.path,
  });
}

/**
 * Sets model header on response
 * @param {Response} res - Express response object
 * @param {string} model - Model name
 */
export function setModelHeader(res, model) {
  res.setHeader("X-Model", model);
  res.setHeader("x-model", model);
}

