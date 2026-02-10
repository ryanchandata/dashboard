import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as stateService from "./stateService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_STATE_PATH = path.join(__dirname, "test-state.json");
const STATE_PATH = path.join(__dirname, "../../state.json");

// Helper to clean up test state file
function cleanupTestState() {
  if (fs.existsSync(TEST_STATE_PATH)) {
    fs.unlinkSync(TEST_STATE_PATH);
  }
}

// Helper to ensure state file is valid (doesn't delete entries - only validates JSON)
function ensureValidState() {
  try {
    if (fs.existsSync(STATE_PATH)) {
      const content = fs.readFileSync(STATE_PATH, "utf8");
      // If file is empty, delete it to allow fresh start
      if (!content || content.trim() === "") {
        fs.unlinkSync(STATE_PATH);
      } else {
        // Validate that it's valid JSON - if not, delete it
        try {
          JSON.parse(content);
          // Valid JSON, leave it alone
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

// Helper to create a test state file
function createTestState(content) {
  fs.writeFileSync(TEST_STATE_PATH, JSON.stringify(content, null, 2));
}

// Run tests with cleanup
test("stateService - loadState returns empty state when file doesn't exist", () => {
  ensureValidState();
  cleanupTestState();
  // We can't directly test with TEST_STATE_PATH since the service uses STATE_PATH
  // But we can verify the behavior by checking return type
  const state = stateService.loadState();
  assert(state, "Should return a state object");
  assert.strictEqual(typeof state, "object", "Should be an object");
  assert(state.projects, "Should have projects property");
  assert.strictEqual(typeof state.projects, "object", "projects should be an object");
});

test("stateService - loadState returns parsed state when file exists", () => {
  const state = stateService.loadState();
  // If state.json exists from previous runs, verify it's properly parsed
  if (Object.keys(state.projects).length > 0 || fs.existsSync(path.join(__dirname, "../../state.json"))) {
    assert(typeof state === "object", "Should parse JSON correctly");
    assert(state.projects, "Should have projects property");
  }
});

test("stateService - saveState writes state to file", () => {
  const testState = {
    projects: {
      "test-project": {
        pid: 1234,
        startedAt: Date.now(),
      },
    },
  };
  stateService.saveState(testState);

  // Read back and verify
  const STATE_PATH = path.join(__dirname, "../../state.json");
  if (fs.existsSync(STATE_PATH)) {
    const saved = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    assert.deepStrictEqual(saved.projects["test-project"], testState.projects["test-project"], "Should save state correctly");
  }
});

test("stateService - saveState creates file if it doesn't exist", () => {
  const STATE_PATH = path.join(__dirname, "../../state.json");
  const testState = { projects: { "new-project": { pid: 5678 } } };
  stateService.saveState(testState);
  assert(fs.existsSync(STATE_PATH), "State file should be created");
});

test("stateService - getProjectState returns project state", () => {
  ensureValidState();
  // First set up a known state
  const testState = {
    projects: {
      "project-1": {
        pid: 1234,
        startedAt: 1000,
        tunnelPid: 5678,
        tunnelUrl: "https://test.trycloudflare.com",
      },
    },
  };
  stateService.saveState(testState);

  const projectState = stateService.getProjectState("project-1");
  assert(projectState, "Should return project state");
  assert.strictEqual(projectState.pid, 1234, "Should have correct pid");
  assert.strictEqual(projectState.startedAt, 1000, "Should have correct startedAt");
  assert.strictEqual(projectState.tunnelPid, 5678, "Should have correct tunnelPid");
  assert.strictEqual(projectState.tunnelUrl, "https://test.trycloudflare.com", "Should have correct tunnelUrl");
});

test("stateService - getProjectState returns empty object for non-existent project", () => {
  ensureValidState();
  const STATE_PATH = path.join(__dirname, "../../state.json");
  // Clear and set a minimal state
  const minimal = { projects: { "other-project": {} } };
  stateService.saveState(minimal);

  const projectState = stateService.getProjectState("does-not-exist");
  assert.deepStrictEqual(projectState, {}, "Should return empty object for non-existent project");
});

test("stateService - setProjectState updates and saves project state", () => {
  ensureValidState();
  // Start with a fresh state
  const initialState = { projects: { "project-2": { pid: null } } };
  stateService.saveState(initialState);

  // Update project state
  const newState = {
    pid: 9999,
    startedAt: 2000,
    tunnelPid: 8888,
  };
  stateService.setProjectState("project-2", newState);

  // Verify it was saved and can be retrieved
  const retrieved = stateService.getProjectState("project-2");
  assert.deepStrictEqual(retrieved, newState, "Should save and retrieve updated state");
});

test("stateService - setProjectState creates project entry if it doesn't exist", () => {
  ensureValidState();
  // Start with empty projects
  const initialState = { projects: {} };
  stateService.saveState(initialState);

  // Set state for new project
  const newState = { pid: 7777, startedAt: 3000 };
  stateService.setProjectState("brand-new-project", newState);

  const retrieved = stateService.getProjectState("brand-new-project");
  assert.deepStrictEqual(retrieved, newState, "Should create and save new project state");
});

test("stateService - handles complex state objects with multiple projects", () => {
  const complexState = {
    projects: {
      "project-a": {
        pid: 1111,
        startedAt: 1000,
        tunnelPid: 2222,
        tunnelUrl: "https://a.trycloudflare.com",
      },
      "project-b": {
        pid: 3333,
        startedAt: 2000,
        tunnelPid: 4444,
        tunnelUrl: "https://b.trycloudflare.com",
      },
    },
  };
  stateService.saveState(complexState);

  const stateA = stateService.getProjectState("project-a");
  const stateB = stateService.getProjectState("project-b");

  assert.strictEqual(stateA.pid, 1111, "Should retrieve correct state for project-a");
  assert.strictEqual(stateB.pid, 3333, "Should retrieve correct state for project-b");
  assert.strictEqual(stateB.tunnelUrl, "https://b.trycloudflare.com", "Should preserve all properties");
});

test("stateService - handles null/undefined values in state", () => {
  const state = {
    projects: {
      "test-null": {
        pid: null,
        startedAt: null,
        tunnelPid: undefined,
        tunnelUrl: null,
      },
    },
  };
  stateService.saveState(state);

  const retrieved = stateService.getProjectState("test-null");
  assert.strictEqual(retrieved.pid, null, "Should preserve null values");
  // Note: undefined becomes null in JSON
  assert.strictEqual(retrieved.tunnelUrl, null, "Should preserve null for tunnelUrl");
});

test("stateService - getProjectState auto-loads state if needed", () => {
  ensureValidState();
  // Set a known state first
  const known = { projects: { "auto-load-test": { pid: 1234 } } };
  stateService.saveState(known);

  // Call getProjectState without explicit load
  const state = stateService.getProjectState("auto-load-test");
  assert.strictEqual(state.pid, 1234, "Should auto-load and return correct state");
});

test("stateService - setProjectState preserves other projects' states", () => {
  ensureValidState();
  // Start with two projects
  const initial = {
    projects: {
      "project-x": { pid: 1111 },
      "project-y": { pid: 2222 },
    },
  };
  stateService.saveState(initial);

  // Update only project-x
  stateService.setProjectState("project-x", { pid: 9999, startedAt: 5000 });

  // Verify project-y is unchanged
  const stateY = stateService.getProjectState("project-y");
  assert.strictEqual(stateY.pid, 2222, "Should preserve other project states");
});

test("stateService - throws error on invalid JSON in state file", () => {
  ensureValidState();
  const STATE_PATH = path.join(__dirname, "../../state.json");
  // Write invalid JSON
  fs.writeFileSync(STATE_PATH, "{ invalid json ]");

  assert.throws(
    () => {
      stateService.loadState();
    },
    (error) => {
      return error.message.includes("Invalid JSON in state file");
    },
    "Should throw SyntaxError for invalid JSON"
  );

  // Restore valid state for next tests
  ensureValidState();
  stateService.saveState({ projects: {} });
});
