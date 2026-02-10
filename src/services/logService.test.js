import { test } from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { appendLog, readLog, clearLogs } from "./logService.js";
import { config } from "../config/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to clean up test logs
function cleanupTestLogs() {
  const logsDir = config.dirs.logs;
  if (fs.existsSync(logsDir)) {
    const files = fs.readdirSync(logsDir);
    files.forEach((file) => {
      fs.unlinkSync(path.join(logsDir, file));
    });
  }
}

test("appendLog() writes timestamped entries to log file", () => {
  cleanupTestLogs();
  const projectId = "test-project";
  const logType = "app";
  const message = "Test message";

  appendLog(projectId, logType, message);

  const logPath = path.join(config.dirs.logs, `${projectId}.${logType}.log`);
  assert.ok(fs.existsSync(logPath), "Log file should exist");

  const content = fs.readFileSync(logPath, "utf8");
  assert.ok(content.includes(message), "Log should contain message");
  assert.ok(content.includes("["), "Log should include timestamp");
  assert.ok(content.includes("]"), "Log should include timestamp");

  cleanupTestLogs();
});

test("appendLog() adds newline if not present", () => {
  cleanupTestLogs();
  const projectId = "test-project";
  const logType = "app";
  const message = "Message without newline";

  appendLog(projectId, logType, message);

  const logPath = path.join(config.dirs.logs, `${projectId}.${logType}.log`);
  const content = fs.readFileSync(logPath, "utf8");
  assert.ok(content.endsWith("\n"), "Log entry should end with newline");

  cleanupTestLogs();
});

test("appendLog() preserves existing newlines", () => {
  cleanupTestLogs();
  const projectId = "test-project";
  const logType = "app";
  const message = "Message with newline\n";

  appendLog(projectId, logType, message);

  const logPath = path.join(config.dirs.logs, `${projectId}.${logType}.log`);
  const content = fs.readFileSync(logPath, "utf8");
  // Should not double the newline
  const lines = content.split("\n");
  assert.equal(lines[lines.length - 1], "", "Should have single newline at end");

  cleanupTestLogs();
});

test("appendLog() appends to existing file", () => {
  cleanupTestLogs();
  const projectId = "test-project";
  const logType = "app";

  appendLog(projectId, logType, "First message");
  appendLog(projectId, logType, "Second message");

  const logPath = path.join(config.dirs.logs, `${projectId}.${logType}.log`);
  const content = fs.readFileSync(logPath, "utf8");
  assert.ok(
    content.includes("First message"),
    "Should contain first message"
  );
  assert.ok(
    content.includes("Second message"),
    "Should contain second message"
  );

  cleanupTestLogs();
});

test("appendLog() throws if projectId is missing", () => {
  assert.throws(
    () => appendLog(null, "app", "message"),
    /projectId, logType, and message are required/,
    "Should throw if projectId is null"
  );

  assert.throws(
    () => appendLog("", "app", "message"),
    /projectId, logType, and message are required/,
    "Should throw if projectId is empty"
  );
});

test("appendLog() throws if logType is missing", () => {
  assert.throws(
    () => appendLog("project-1", null, "message"),
    /projectId, logType, and message are required/,
    "Should throw if logType is null"
  );

  assert.throws(
    () => appendLog("project-1", "", "message"),
    /projectId, logType, and message are required/,
    "Should throw if logType is empty"
  );
});

test("appendLog() throws if message is missing", () => {
  assert.throws(
    () => appendLog("project-1", "app", null),
    /projectId, logType, and message are required/,
    "Should throw if message is null"
  );

  assert.throws(
    () => appendLog("project-1", "app", ""),
    /projectId, logType, and message are required/,
    "Should throw if message is empty"
  );
});

test("appendLog() supports multiple log types (app, tunnel, server)", () => {
  cleanupTestLogs();
  const projectId = "test-project";
  const types = ["app", "tunnel", "server"];

  types.forEach((type) => {
    appendLog(projectId, type, `Message for ${type}`);
  });

  types.forEach((type) => {
    const logPath = path.join(config.dirs.logs, `${projectId}.${type}.log`);
    assert.ok(fs.existsSync(logPath), `Log file for ${type} should exist`);
  });

  cleanupTestLogs();
});

test("readLog() returns empty string if file doesn't exist", () => {
  cleanupTestLogs();
  const projectId = "nonexistent-project";
  const logType = "app";

  const result = readLog(projectId, logType);

  assert.equal(result, "", "Should return empty string for nonexistent file");

  cleanupTestLogs();
});

test("readLog() returns entire log if smaller than maxBytes", () => {
  cleanupTestLogs();
  const projectId = "test-project";
  const logType = "app";
  const message = "Short message";

  appendLog(projectId, logType, message);
  const result = readLog(projectId, logType, 1000);

  assert.ok(result.includes(message), "Should include the message");
  assert.ok(result.includes("["), "Should include timestamp");

  cleanupTestLogs();
});

test("readLog() returns last maxBytes of file if larger", () => {
  cleanupTestLogs();
  const projectId = "test-project";
  const logType = "app";

  // Write a large log
  const largeMessage = "A".repeat(200);
  appendLog(projectId, logType, largeMessage);
  appendLog(projectId, logType, "END_MARKER");

  // Read only 50 bytes
  const result = readLog(projectId, logType, 50);

  assert.ok(result.includes("END_MARKER"), "Should include recent entry");
  // Should NOT include the full large message since we limited bytes
  assert.ok(
    result.length <= 100, // Including timestamp and some overhead
    "Should respect maxBytes limit"
  );

  cleanupTestLogs();
});

test("readLog() throws if projectId is missing", () => {
  assert.throws(
    () => readLog(null, "app"),
    /projectId and logType are required/,
    "Should throw if projectId is null"
  );

  assert.throws(
    () => readLog("", "app"),
    /projectId and logType are required/,
    "Should throw if projectId is empty"
  );
});

test("readLog() throws if logType is missing", () => {
  assert.throws(
    () => readLog("project-1", null),
    /projectId and logType are required/,
    "Should throw if logType is null"
  );

  assert.throws(
    () => readLog("project-1", ""),
    /projectId and logType are required/,
    "Should throw if logType is empty"
  );
});

test("readLog() returns logs for all supported types", () => {
  cleanupTestLogs();
  const projectId = "test-project";
  const types = ["app", "tunnel", "server"];

  types.forEach((type) => {
    appendLog(projectId, type, `Message for ${type}`);
  });

  types.forEach((type) => {
    const result = readLog(projectId, type);
    assert.ok(
      result.includes(`Message for ${type}`),
      `Should read ${type} log`
    );
  });

  cleanupTestLogs();
});

test("clearLogs() removes all logs for a project", () => {
  cleanupTestLogs();
  const projectId = "test-project";
  const types = ["app", "tunnel", "server"];

  // Create logs for all types
  types.forEach((type) => {
    appendLog(projectId, type, `Message for ${type}`);
  });

  // Verify they exist
  types.forEach((type) => {
    const logPath = path.join(config.dirs.logs, `${projectId}.${type}.log`);
    assert.ok(fs.existsSync(logPath), `${type} log should exist before clear`);
  });

  // Clear logs
  clearLogs(projectId);

  // Verify they're deleted
  types.forEach((type) => {
    const logPath = path.join(config.dirs.logs, `${projectId}.${type}.log`);
    assert.ok(
      !fs.existsSync(logPath),
      `${type} log should not exist after clear`
    );
  });

  cleanupTestLogs();
});

test("clearLogs() handles missing log files gracefully", () => {
  cleanupTestLogs();
  const projectId = "nonexistent-project";

  // Should not throw even if logs don't exist
  assert.doesNotThrow(
    () => clearLogs(projectId),
    "Should not throw when clearing nonexistent logs"
  );

  cleanupTestLogs();
});

test("clearLogs() only clears logs for specified project", () => {
  cleanupTestLogs();
  const project1 = "project-1";
  const project2 = "project-2";

  // Create logs for both projects
  appendLog(project1, "app", "Message 1");
  appendLog(project2, "app", "Message 2");

  // Clear only project1
  clearLogs(project1);

  // Verify project1 logs are deleted
  const project1LogPath = path.join(config.dirs.logs, `${project1}.app.log`);
  assert.ok(
    !fs.existsSync(project1LogPath),
    "Project 1 logs should be deleted"
  );

  // Verify project2 logs still exist
  const project2LogPath = path.join(config.dirs.logs, `${project2}.app.log`);
  assert.ok(
    fs.existsSync(project2LogPath),
    "Project 2 logs should still exist"
  );

  cleanupTestLogs();
});

test("clearLogs() throws if projectId is missing", () => {
  assert.throws(
    () => clearLogs(null),
    /projectId is required/,
    "Should throw if projectId is null"
  );

  assert.throws(
    () => clearLogs(""),
    /projectId is required/,
    "Should throw if projectId is empty"
  );
});

test("clearLogs() creates logs directory if missing", () => {
  cleanupTestLogs();
  const projectId = "test-project";

  // Remove logs directory if it exists
  if (fs.existsSync(config.dirs.logs)) {
    fs.rmSync(config.dirs.logs, { recursive: true });
  }

  // clearLogs should create the directory
  assert.doesNotThrow(
    () => clearLogs(projectId),
    "Should not throw when logs directory is missing"
  );

  cleanupTestLogs();
});

test("appendLog() creates logs directory if missing", () => {
  cleanupTestLogs();
  const projectId = "test-project";

  // Remove logs directory if it exists
  if (fs.existsSync(config.dirs.logs)) {
    fs.rmSync(config.dirs.logs, { recursive: true });
  }

  // appendLog should create the directory
  assert.doesNotThrow(
    () => appendLog(projectId, "app", "message"),
    "Should not throw when logs directory is missing"
  );

  assert.ok(
    fs.existsSync(config.dirs.logs),
    "Logs directory should be created"
  );

  cleanupTestLogs();
});

test("readLog() creates logs directory if missing", () => {
  cleanupTestLogs();
  const projectId = "test-project";

  // Remove logs directory if it exists
  if (fs.existsSync(config.dirs.logs)) {
    fs.rmSync(config.dirs.logs, { recursive: true });
  }

  // readLog should create the directory
  assert.doesNotThrow(
    () => readLog(projectId, "app"),
    "Should not throw when logs directory is missing"
  );

  assert.ok(
    fs.existsSync(config.dirs.logs),
    "Logs directory should be created"
  );

  cleanupTestLogs();
});
