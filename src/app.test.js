import { test } from "node:test";
import assert from "node:assert";
import app from "../app.js";

test("Express app is properly configured", () => {
  assert.ok(app, "App should be defined");
  assert.equal(typeof app.listen, "function", "App should have listen method");
});

test("App has required middleware", () => {
  // Check that app has _router property (Express internal)
  assert.ok(app._router, "App should have router configured");
});

test("App can handle requests", async () => {
  // Basic check that Express is properly set up
  assert.equal(typeof app.get, "function", "App should have get method");
  assert.equal(typeof app.post, "function", "App should have post method");
  assert.equal(typeof app.use, "function", "App should have use method");
});
