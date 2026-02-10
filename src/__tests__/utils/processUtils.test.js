/**
 * Test utilities test to verify mock utilities work
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import {
  createMockSpawn,
  MockProcess,
  ProcessTracker,
  createMockChildProcess,
} from "../utils/processUtils.js";

describe("Process Mock Utilities", () => {
  describe("MockProcess", () => {
    it("should create a mock process with default PID", () => {
      const proc = new MockProcess();
      assert.strictEqual(proc.pid, 12345);
      assert.strictEqual(proc.killed, false);
    });

    it("should handle kill signal", () => {
      const proc = new MockProcess();
      const killed = proc.kill("SIGTERM");
      assert.strictEqual(killed, true);
      assert.strictEqual(proc.killed, true);
    });

    it("should track signals", () => {
      const proc = new MockProcess();
      proc.kill("SIGTERM");
      proc.kill("SIGKILL");
      assert.deepStrictEqual(proc.getSignals(), ["SIGTERM", "SIGKILL"]);
    });

    it("should emit events", () => {
      const proc = new MockProcess();
      let exitCode = null;
      proc.on("exit", (code) => {
        exitCode = code;
      });
      proc.kill();
      assert.strictEqual(exitCode, 1);
    });
  });

  describe("createMockSpawn", () => {
    it("should create a spawn function", () => {
      const spawn = createMockSpawn();
      assert.strictEqual(typeof spawn, "function");
    });

    it("should track spawned processes", () => {
      const spawn = createMockSpawn();
      spawn("npm", ["start"]);
      spawn("node", ["server.js"]);

      const processes = spawn.getProcesses();
      assert.strictEqual(processes.length, 2);
      assert.strictEqual(processes[0].command, "npm");
      assert.deepStrictEqual(processes[0].args, ["start"]);
    });
  });

  describe("ProcessTracker", () => {
    it("should track spawned and killed processes", () => {
      const tracker = new ProcessTracker();
      const proc = tracker.trackSpawn("npm", ["start"]);

      assert.strictEqual(tracker.getSpawnedProcesses().length, 1);

      proc.kill("SIGTERM");
      const killed = tracker.getKilledProcesses();
      assert.strictEqual(killed.length, 1);
      assert.strictEqual(killed[0].signal, "SIGTERM");
    });

    it("should clear tracking data", () => {
      const tracker = new ProcessTracker();
      tracker.trackSpawn("npm", ["start"]);
      tracker.clear();

      assert.strictEqual(tracker.getSpawnedProcesses().length, 0);
    });
  });
});
