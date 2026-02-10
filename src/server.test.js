/**
 * Server integration tests
 * 
 * Tests that verify the server.js module structure:
 * - Imports Express app from src/app.js correctly
 * - Loads configuration from config service
 * - Loads state from stateService
 * - Has graceful shutdown handlers registered
 * 
 * Note: We test the server structure without running it to avoid port conflicts during test runs.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("Server integration tests", async (suite) => {
  // Test 1: server.js file exists and contains Express app import
  await suite.test("server.js imports Express app from src/app.js", () => {
    const serverPath = path.join(__dirname, "..", "server.js");
    const content = readFileSync(serverPath, "utf8");
    assert.ok(content.includes('import app from "./src/app.js"'), "server.js should import app from src/app.js");
  });

  // Test 2: server.js imports config from config service
  await suite.test("server.js imports config from src/config/index.js", () => {
    const serverPath = path.join(__dirname, "..", "server.js");
    const content = readFileSync(serverPath, "utf8");
    assert.ok(content.includes('import { config } from "./src/config/index.js"'), "server.js should import config");
  });

  // Test 3: server.js imports stateService
  await suite.test("server.js imports stateService from src/services/stateService.js", () => {
    const serverPath = path.join(__dirname, "..", "server.js");
    const content = readFileSync(serverPath, "utf8");
    assert.ok(content.includes('import { loadState } from "./src/services/stateService.js"'), "server.js should import loadState from stateService");
  });

  // Test 4: server.js loads state on startup
  await suite.test("server.js calls loadState() on startup", () => {
    const serverPath = path.join(__dirname, "..", "server.js");
    const content = readFileSync(serverPath, "utf8");
    assert.ok(content.includes("loadState()"), "server.js should call loadState()");
  });

  // Test 5: server.js has SIGTERM handler
  await suite.test("server.js registers SIGTERM handler for graceful shutdown", () => {
    const serverPath = path.join(__dirname, "..", "server.js");
    const content = readFileSync(serverPath, "utf8");
    assert.ok(content.includes('process.on("SIGTERM"'), "server.js should have SIGTERM handler");
    assert.ok(content.includes("server.close"), "SIGTERM handler should close server");
  });

  // Test 6: server.js has SIGINT handler
  await suite.test("server.js registers SIGINT handler for graceful shutdown", () => {
    const serverPath = path.join(__dirname, "..", "server.js");
    const content = readFileSync(serverPath, "utf8");
    assert.ok(content.includes('process.on("SIGINT"'), "server.js should have SIGINT handler");
    assert.ok(content.includes("server.close"), "SIGINT handler should close server");
  });

  // Test 7: server.js creates HTTP server with app
  await suite.test("server.js creates HTTP server using app.listen()", () => {
    const serverPath = path.join(__dirname, "..", "server.js");
    const content = readFileSync(serverPath, "utf8");
    assert.ok(content.includes("app.listen"), "server.js should use app.listen() to create server");
  });

  // Test 8: server.js exports server
  await suite.test("server.js exports the server", () => {
    const serverPath = path.join(__dirname, "..", "server.js");
    const content = readFileSync(serverPath, "utf8");
    assert.ok(content.includes("export default server"), "server.js should export server");
  });
});
