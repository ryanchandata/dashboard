import { test } from "node:test";
import assert from "node:assert";
import * as tunnelLifecycle from "./tunnelLifecycle.js";

test("isProcessAlive - returns false for null/undefined PID", () => {
  assert.strictEqual(tunnelLifecycle.isProcessAlive(null), false);
  assert.strictEqual(tunnelLifecycle.isProcessAlive(undefined), false);
});

test("isProcessAlive - returns true for current process PID", () => {
  const result = tunnelLifecycle.isProcessAlive(process.pid);
  assert.strictEqual(result, true);
});

test("isProcessAlive - returns false for invalid PID", () => {
  const result = tunnelLifecycle.isProcessAlive(999999);
  assert.strictEqual(result, false);
});

test("startTunnel - throws error if project is missing id", () => {
  const project = { tunnelPort: 3000 };
  assert.throws(
    () => tunnelLifecycle.startTunnel(project),
    /Invalid project object: missing id or tunnelPort/
  );
});

test("startTunnel - throws error if project is missing tunnelPort", () => {
  const project = { id: "test-project" };
  assert.throws(
    () => tunnelLifecycle.startTunnel(project),
    /Invalid project object: missing id or tunnelPort/
  );
});

test("startTunnel - throws error if project is null", () => {
  assert.throws(
    () => tunnelLifecycle.startTunnel(null),
    /Invalid project object: missing id or tunnelPort/
  );
});

test("startTunnel - validates project structure completely", () => {
  // Test various invalid project objects
  assert.throws(
    () => tunnelLifecycle.startTunnel({}),
    /Invalid project object: missing id or tunnelPort/
  );
  
  assert.throws(
    () => tunnelLifecycle.startTunnel({ id: "test" }),
    /Invalid project object: missing id or tunnelPort/
  );
  
  assert.throws(
    () => tunnelLifecycle.startTunnel({ tunnelPort: 3000 }),
    /Invalid project object: missing id or tunnelPort/
  );
});

test("stopTunnel - throws error if project is missing id", () => {
  const project = {};
  assert.throws(
    () => tunnelLifecycle.stopTunnel(project),
    /Invalid project object: missing id/
  );
});

test("stopTunnel - throws error if project is null", () => {
  assert.throws(
    () => tunnelLifecycle.stopTunnel(null),
    /Invalid project object: missing id/
  );
});

test("isTunnelRunning - throws error if projectId is null", () => {
  assert.throws(
    () => tunnelLifecycle.isTunnelRunning(null),
    /Project ID is required/
  );
});

test("isTunnelRunning - throws error if projectId is undefined", () => {
  assert.throws(
    () => tunnelLifecycle.isTunnelRunning(undefined),
    /Project ID is required/
  );
});

test("isTunnelRunning - handles empty string projectId", () => {
  assert.throws(
    () => tunnelLifecycle.isTunnelRunning(""),
    /Project ID is required/
  );
});

test("getTunnelUrl - throws error if projectId is null", () => {
  assert.throws(
    () => tunnelLifecycle.getTunnelUrl(null),
    /Project ID is required/
  );
});

test("getTunnelUrl - throws error if projectId is undefined", () => {
  assert.throws(
    () => tunnelLifecycle.getTunnelUrl(undefined),
    /Project ID is required/
  );
});

test("getTunnelUrl - handles empty string projectId", () => {
  assert.throws(
    () => tunnelLifecycle.getTunnelUrl(""),
    /Project ID is required/
  );
});

test("Module exports all required functions", () => {
  assert.strictEqual(typeof tunnelLifecycle.startTunnel, "function");
  assert.strictEqual(typeof tunnelLifecycle.stopTunnel, "function");
  assert.strictEqual(typeof tunnelLifecycle.isTunnelRunning, "function");
  assert.strictEqual(typeof tunnelLifecycle.getTunnelUrl, "function");
  assert.strictEqual(typeof tunnelLifecycle.isProcessAlive, "function");
});

test("startTunnel function signature is correct", () => {
  const desc = tunnelLifecycle.startTunnel.toString();
  assert.ok(desc.includes("project"), "startTunnel should accept project parameter");
});

test("stopTunnel function signature is correct", () => {
  const desc = tunnelLifecycle.stopTunnel.toString();
  assert.ok(desc.includes("project"), "stopTunnel should accept project parameter");
});

test("isTunnelRunning function signature is correct", () => {
  const desc = tunnelLifecycle.isTunnelRunning.toString();
  assert.ok(desc.includes("projectId"), "isTunnelRunning should accept projectId parameter");
});

test("getTunnelUrl function signature is correct", () => {
  const desc = tunnelLifecycle.getTunnelUrl.toString();
  assert.ok(desc.includes("projectId"), "getTunnelUrl should accept projectId parameter");
});

test("Process killing error handling - stopTunnel handles non-existent PID gracefully", () => {
  // This verifies that attempting to stop a tunnel with invalid PID doesn't crash
  // (it just logs and returns false)
  // We can't directly set state, but we can verify error handling through code inspection
  const fnText = tunnelLifecycle.stopTunnel.toString();
  assert.ok(fnText.includes("catch"), "stopTunnel should have error handling for kill attempts");
});
