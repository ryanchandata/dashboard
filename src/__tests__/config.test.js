/**
 * Unit tests for configuration loading
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { config } from "../config/index.js";

describe("Configuration Module", () => {
  it("should load configuration with required properties", () => {
    assert.ok(config, "Config should be defined");
    assert.ok(config.port, "Config should have port");
    assert.ok(config.env, "Config should have env");
    assert.ok(config.dirs, "Config should have dirs");
  });

  it("should have valid port number", () => {
    assert.strictEqual(typeof config.port, "number", "Port should be a number");
    assert.ok(config.port > 0, "Port should be positive");
    assert.ok(config.port <= 65535, "Port should be valid");
  });

  it("should have valid environment", () => {
    const validEnvs = ["development", "production", "test"];
    assert.ok(
      validEnvs.includes(config.env),
      `Environment should be one of ${validEnvs.join(", ")}`
    );
  });

  it("should have directories configured", () => {
    assert.ok(config.dirs, "Dirs object should exist");
    assert.ok(config.dirs.root, "Root directory should be defined");
    assert.ok(config.dirs.config, "Config file path should be defined");
    assert.ok(config.dirs.state, "State file path should be defined");
    assert.ok(config.dirs.logs, "Logs directory should be defined");
  });
});

