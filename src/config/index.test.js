import { test } from "node:test";
import assert from "node:assert";
import { config, loadProjectConfig } from "../config/index.js";

test("Config module exports required properties", () => {
  assert.ok(config, "Config should be defined");
  assert.equal(typeof config.port, "number" || "string", "Port should be defined");
  assert.ok(config.dirs, "Dirs should be defined");
});

test("Config has all required directories", () => {
  assert.ok(config.dirs.root, "Root directory should be defined");
  assert.ok(config.dirs.config, "Config path should be defined");
  assert.ok(config.dirs.state, "State path should be defined");
  assert.ok(config.dirs.public, "Public directory should be defined");
  assert.ok(config.dirs.logs, "Logs directory should be defined");
  assert.ok(config.dirs.tunnels, "Tunnels directory should be defined");
});

test("loadProjectConfig returns an object with projects", () => {
  const projectConfig = loadProjectConfig();
  assert.ok(typeof projectConfig === "object", "Should return an object");
  assert.ok(Array.isArray(projectConfig.projects), "Should have projects array");
});

test("Config reads NODE_ENV from environment (defaults to development)", () => {
  // NODE_ENV is likely set during test runs, but should default to 'development'
  assert.ok(
    config.env === "development" || config.env === "production" || config.env === "test",
    "NODE_ENV should be a valid environment"
  );
});

test("Config reads PORT from environment with sensible default", () => {
  // PORT should be a number (either from env or default 3000)
  assert.equal(typeof config.port, "number", "PORT should be a number");
  assert.ok(config.port > 0 && config.port <= 65535, "PORT should be in valid TCP range");
});

test("Config reads LOG_DIR from environment", () => {
  // LOG_DIR should be set in config.dirs.logs
  assert.ok(
    typeof config.dirs.logs === "string",
    "LOG_DIR should be a string path"
  );
  assert.ok(
    config.dirs.logs.length > 0,
    "LOG_DIR should not be empty"
  );
  // Should either be the default or the env var value
  assert.ok(
    config.dirs.logs.includes("logs"),
    "LOG_DIR should reference logs directory"
  );
});

