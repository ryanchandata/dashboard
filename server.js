/**
 * Server entry point
 * 
 * This file integrates all services into the Express application:
 * - Loads configuration via configService
 * - Loads state from disk via stateService
 * - Initializes the middleware stack (error handling, static files, logging)
 * - Mounts all API routes
 * - Starts the HTTP server on configured port
 * - Handles graceful shutdown (SIGTERM, SIGINT)
 */

import app from "./src/app.js";
import { config } from "./src/config/index.js";
import { loadState } from "./src/services/stateService.js";

// Initialize state on startup (loads from disk or creates empty state)
try {
  loadState();
  console.log("State loaded from disk");
} catch (error) {
  console.error("Failed to load state:", error.message);
  // Continue - state will be created on first save
}

// Create HTTP server with Express app
const server = app.listen(config.port, () => {
  console.log(
    `Dashboard server running on http://127.0.0.1:${config.port} (${config.env})`
  );
});

// Graceful shutdown on SIGTERM (Docker/Kubernetes termination signal)
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default server;
