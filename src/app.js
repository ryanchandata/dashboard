import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config/index.js";
import { loadConfig } from "./services/configService.js";
import { requestLoggerMiddleware, errorHandler, notFoundHandler, staticFilesMiddleware } from "./middleware/index.js";
import projectsRouter from "./routes/projects.js";
import configRouter from "./routes/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize config service on startup
try {
  loadConfig();
} catch (error) {
  console.error("Failed to load configuration:", error.message);
  // Continue with server startup - routes will handle missing config
}

// Middleware
app.use(requestLoggerMiddleware);
app.use(cors());
app.use(bodyParser.json());

// Static files middleware (handles MIME types, caching, and SPA fallback)
app.use(staticFilesMiddleware);

// API Routes
app.use("/api/projects", projectsRouter);
app.use("/api/config", configRouter);

// 404 Not Found handler (before error handler)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

export default app;
