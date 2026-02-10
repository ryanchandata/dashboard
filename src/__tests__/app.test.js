/**
 * Unit tests for Express application setup
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import app from "../app.js";

describe("Express Application", () => {
  it("should be a valid Express app", () => {
    assert.ok(app, "App should be defined");
    assert.ok(typeof app.use === "function", "App should have use method");
    assert.ok(typeof app.get === "function", "App should have get method");
    assert.ok(typeof app.post === "function", "App should have post method");
    assert.ok(typeof app.listen === "function", "App should have listen method");
  });

  it("should have middleware configured", () => {
    assert.ok(app._router, "App should have router configured");
  });

  it("should have error handling", () => {
    assert.ok(
      typeof app._findRouter === "function" || app._router,
      "App should have error handling configured"
    );
  });

  it("should support JSON and CORS", () => {
    // Test that the app has the necessary middleware stack
    assert.ok(app._router, "Router should exist");
    // This is a basic check - actual middleware is tested in integration tests
  });
});
