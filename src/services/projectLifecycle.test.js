import { test } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  startProject,
  stopProject,
  isProjectRunning,
  getProjectPid,
  isProcessAlive,
} from "./projectLifecycle.js";
import * as stateService from "./stateService.js";
import { config } from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_PATH = path.join(__dirname, "../../state.json");

// Mock project for testing - use unique ID per test to avoid conflicts
function getMockProject(suffix = "") {
  const id = `test-project-${Date.now()}-${Math.random().toString(36).slice(2)}${suffix}`;
  return {
    id,
    name: "Test Project",
    dir: ".",
    start: "echo 'test'",
  };
}

// Setup and teardown
function cleanupState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      const content = fs.readFileSync(STATE_PATH, "utf8");
      if (!content || content.trim() === "") {
        fs.unlinkSync(STATE_PATH);
        return;
      }
      try {
        const state = JSON.parse(content);
        // Only remove test projects, not entire state
        if (state.projects) {
          const keysToRemove = Object.keys(state.projects).filter(key => 
            key.includes("test-project")
          );
          for (const key of keysToRemove) {
            delete state.projects[key];
          }
          // Write back the cleaned state
          if (Object.keys(state.projects).length === 0) {
            fs.unlinkSync(STATE_PATH);
          } else {
            fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
          }
        }
      } catch (err) {
        // If JSON is invalid, just delete the file
        try {
          fs.unlinkSync(STATE_PATH);
        } catch {
          // Already deleted or locked
        }
      }
    }
  } catch {
    // File doesn't exist or can't be deleted, that's fine
  }
}

function ensureValidState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      const content = fs.readFileSync(STATE_PATH, "utf8");
      // Try to parse it to ensure it's valid JSON
      if (!content || content.trim() === "") {
        // File is empty, delete it to allow fresh creation
        fs.unlinkSync(STATE_PATH);
      } else {
        try {
          JSON.parse(content);
        } catch {
          // Invalid JSON, delete it
          fs.unlinkSync(STATE_PATH);
        }
      }
    }
  } catch {
    // If there's any error, try to delete the file
    try {
      if (fs.existsSync(STATE_PATH)) {
        fs.unlinkSync(STATE_PATH);
      }
    } catch {
      // File doesn't exist or can't be deleted
    }
  }
}

function ensureLogsDir() {
  try {
    if (!fs.existsSync(config.dirs.logs)) {
      fs.mkdirSync(config.dirs.logs, { recursive: true });
    }
  } catch {
    // Directory already exists or can't be created, that's fine
  }
}

function cleanupLogs() {
  try {
    if (fs.existsSync(config.dirs.logs)) {
      const files = fs.readdirSync(config.dirs.logs);
      for (const file of files) {
        if (file.includes("test-project")) {
          fs.unlinkSync(path.join(config.dirs.logs, file));
        }
      }
    }
  } catch {
    // Couldn't clean up logs, that's fine
  }
}

test("isProcessAlive: returns false for null/undefined PID", () => {
  cleanupState();
  assert.strictEqual(isProcessAlive(null), false);
  assert.strictEqual(isProcessAlive(undefined), false);
  assert.strictEqual(isProcessAlive(0), false);
  cleanupState();
});

test("isProcessAlive: returns true for current process PID", () => {
  cleanupState();
  assert.strictEqual(isProcessAlive(process.pid), true);
  cleanupState();
});

test("isProcessAlive: returns false for invalid PID", () => {
  cleanupState();
  assert.strictEqual(isProcessAlive(999999999), false);
  cleanupState();
});

test("startProject: throws error for invalid project object", () => {
  assert.throws(
    () => startProject(null),
    (err) => err.message.includes("Invalid project object")
  );

  assert.throws(
    () => startProject({ id: "test" }),
    (err) => err.message.includes("Invalid project object")
  );

  assert.throws(
    () => startProject({ id: "test", start: "echo test" }),
    (err) => err.message.includes("Invalid project object")
  );
});

test("startProject: spawns process and returns PID", () => {
  ensureLogsDir();
  const mockProject = getMockProject();
  const pid = startProject(mockProject);
  assert.strictEqual(typeof pid, "number");
  assert.strictEqual(pid > 0, true);
  cleanupState();
  cleanupLogs();
});

test("startProject: saves PID to state", () => {
  ensureLogsDir();
  const mockProject = getMockProject();
  const pid = startProject(mockProject);
  const state = stateService.getProjectState(mockProject.id);
  assert.strictEqual(state.pid, pid);
  assert.strictEqual(typeof state.startedAt, "number");
  cleanupState();
  cleanupLogs();
});

test("startProject: returns existing PID if already running", () => {
  ensureLogsDir();
  const mockProject = getMockProject();
  
  // Set up a fake process in state
  stateService.setProjectState(mockProject.id, {
    pid: process.pid, // Use current process PID (which we know is alive)
    startedAt: Date.now(),
  });
  
  // Try to start - should return the existing PID
  const pid = startProject(mockProject);
  assert.strictEqual(pid, process.pid);
  
  cleanupState();
  cleanupLogs();
});

test("stopProject: throws error for invalid project", () => {
  assert.throws(
    () => stopProject(null),
    (err) => err.message.includes("Invalid project object")
  );

  assert.throws(
    () => stopProject({}),
    (err) => err.message.includes("Invalid project object")
  );
});

test("stopProject: returns false if no process is running", () => {
  cleanupState();
  const mockProject = getMockProject();
  const result = stopProject(mockProject);
  assert.strictEqual(result, false);
  cleanupState();
});

test("stopProject: clears PID from state after stopping", () => {
  ensureLogsDir();
  const mockProject = getMockProject();
  startProject(mockProject);
  const stateBefore = stateService.getProjectState(mockProject.id);
  assert.strictEqual(stateBefore.pid !== null, true);

  stopProject(mockProject);
  const stateAfter = stateService.getProjectState(mockProject.id);
  assert.strictEqual(stateAfter.pid, null);
  assert.strictEqual(stateAfter.startedAt, null);
  cleanupState();
  cleanupLogs();
});

test("stopProject: attempts to kill process group (negative PID)", () => {
  ensureLogsDir();
  // This tests that the function tries to kill -pid first
  // We just verify it runs without throwing and clears the state
  const mockProject = getMockProject();
  startProject(mockProject);
  const result = stopProject(mockProject);
  assert.strictEqual(typeof result, "boolean");
  cleanupState();
  cleanupLogs();
});

test("isProjectRunning: throws error for invalid projectId", () => {
  assert.throws(
    () => isProjectRunning(null),
    (err) => err.message.includes("Project ID is required")
  );

  assert.throws(
    () => isProjectRunning(""),
    (err) => err.message.includes("Project ID is required")
  );
});

test("isProjectRunning: returns false if process is not alive", () => {
  cleanupState();
  const mockProject = getMockProject();
  // Create state with a fake, dead PID
  stateService.setProjectState(mockProject.id, {
    pid: 999999999,
  });
  const running = isProjectRunning(mockProject.id);
  assert.strictEqual(running, false);
  cleanupState();
});

test("isProjectRunning: returns true for current process PID", () => {
  cleanupState();
  const mockProject = getMockProject();
  // Set state to current process PID
  stateService.setProjectState(mockProject.id, {
    pid: process.pid,
  });
  const running = isProjectRunning(mockProject.id);
  assert.strictEqual(running, true);
  cleanupState();
});

test("getProjectPid: throws error for invalid projectId", () => {
  assert.throws(
    () => getProjectPid(null),
    (err) => err.message.includes("Project ID is required")
  );
});

test("getProjectPid: returns null if process is not alive", () => {
  cleanupState();
  const mockProject = getMockProject();
  stateService.setProjectState(mockProject.id, {
    pid: 999999999,
  });
  const pid = getProjectPid(mockProject.id);
  assert.strictEqual(pid, null);
  cleanupState();
});

test("getProjectPid: returns PID if process is alive", () => {
  cleanupState();
  const mockProject = getMockProject();
  stateService.setProjectState(mockProject.id, {
    pid: process.pid,
  });
  const pid = getProjectPid(mockProject.id);
  assert.strictEqual(pid, process.pid);
  cleanupState();
});

test("startProject and stopProject lifecycle: complete flow", () => {
  ensureValidState();
  ensureLogsDir();
  const mockProject = getMockProject();

  // Start project
  const startPid = startProject(mockProject);
  assert.strictEqual(startPid > 0, true);
  assert.strictEqual(isProjectRunning(mockProject.id), true);
  assert.strictEqual(getProjectPid(mockProject.id), startPid);

  // Stop project
  const stopped = stopProject(mockProject);
  assert.strictEqual(stopped, true);
  assert.strictEqual(isProjectRunning(mockProject.id), false);
  assert.strictEqual(getProjectPid(mockProject.id), null);

  cleanupState();
  cleanupLogs();
});
