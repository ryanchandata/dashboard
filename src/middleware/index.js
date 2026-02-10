export { errorHandler, notFoundHandler } from "./errorHandler.js";
export { staticFilesMiddleware } from "./staticFiles.js";
export { requestLoggerMiddleware } from "./requestLogger.js";

export function loggerMiddleware(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
}
