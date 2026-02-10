import { config } from "../config/index.js";

/**
 * Error handling middleware for Express.
 * Catches all errors from route handlers and returns consistent JSON responses.
 * 
 * Must be the last middleware in the middleware stack.
 * 
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (unused but required for error middleware)
 */
export function errorHandler(err, req, res, next) {
  // Extract status code from error object or default to 500
  const status = err.status || err.statusCode || 500;
  
  // Use error message or default
  const message = err.message || "Internal Server Error";
  
  // Log the error
  console.error(`[${status}] ${message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });
  
  // Build error response
  const response = {
    error: message,
    status,
  };
  
  // In development mode, include additional error details
  if (process.env.NODE_ENV !== "production") {
    response.details = {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    };
    if (err.stack) {
      response.stack = err.stack;
    }
  }
  
  // Send error response
  res.status(status).json(response);
}

/**
 * 404 Not Found middleware.
 * Must be placed after all route handlers.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function notFoundHandler(req, res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.path}`);
  err.status = 404;
  next(err);
}
