import { appendLog } from "../services/logService.js";

/**
 * Request logging middleware
 * Logs all incoming requests with method, path, status, response time, and timestamps
 * Writes to server logs and console (in dev mode)
 */
export function requestLoggerMiddleware(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;

    // Format log message
    const logMessage = `[${timestamp}] ${method} ${path} ${status} ${duration}ms`;

    // Log to console in development mode
    if (process.env.NODE_ENV !== "production") {
      console.log(logMessage);
    }

    // Log to file
    try {
      appendLog("server", "server", logMessage);
    } catch (error) {
      // Don't crash middleware if logging fails
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to write request log:", error.message);
      }
    }
  });

  next();
}
