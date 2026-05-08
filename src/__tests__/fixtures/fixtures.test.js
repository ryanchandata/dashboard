/**
 * Test fixtures verification
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import {
  mockProjects,
  mockDashboardConfig,
  mockState,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createTestContext,
} from "../fixtures/index.js";

describe("Test Fixtures", () => {
  it("should have mock projects defined", () => {
    assert.ok(mockProjects.project1, "Should have project1");
    assert.strictEqual(mockProjects.project1.id, "project1");
    assert.strictEqual(mockProjects.project1.name, "Test Project 1");
  });

  it("should have mock config defined", () => {
    assert.strictEqual(mockDashboardConfig.port, 8787);
    assert.strictEqual(mockDashboardConfig.env, "development");
  });

  it("should have mock state defined", () => {
    assert.ok(mockState.projects.project1);
    assert.strictEqual(mockState.projects.project1.isRunning, false);
  });

  it("should create mock requests", () => {
    const req = createMockRequest({ method: "POST", path: "/api/test" });
    assert.strictEqual(req.method, "POST");
    assert.strictEqual(req.path, "/api/test");
  });

  it("should create mock responses", () => {
    const res = createMockResponse();
    res.status(200).json({ success: true });
    assert.strictEqual(res.statusCode, 200);
    assert.deepStrictEqual(res.sentData, { success: true });
  });

  it("should create mock next function", () => {
    const next = createMockNext();
    assert.strictEqual(typeof next, "function");
  });

  it("should create test context", () => {
    const ctx = createTestContext();
    assert.ok(ctx.config);
    assert.ok(ctx.state);
    assert.ok(ctx.request);
    assert.ok(ctx.response);
    assert.ok(ctx.next);
  });
});
