import fs from "fs";
import path from "path";
import { config } from "../config/index.js";

/**
 * Ensure log directory exists
 * @throws {Error} If directory creation fails
 */
function ensureLogDir() {
  if (!fs.existsSync(config.dirs.logs)) {
    fs.mkdirSync(config.dirs.logs, { recursive: true });
  }
}

/**
 * Get the log file path for a project and log type
 * @param {string} projectId - The project ID
 * @param {string} logType - The log type ('app', 'tunnel', 'server')
 * @returns {string} The full log file path
 */
function getLogFilePath(projectId, logType) {
  return path.join(config.dirs.logs, `${projectId}.${logType}.log`);
}

/**
 * Append a timestamped message to a project log file
 * @param {string} projectId - The project ID
 * @param {string} logType - The log type ('app', 'tunnel', 'server')
 * @param {string} message - The message to log
 * @throws {Error} If write fails
 */
export function appendLog(projectId, logType, message) {
  if (!projectId || !logType || !message) {
    throw new Error("projectId, logType, and message are required");
  }

  ensureLogDir();
  const logPath = getLogFilePath(projectId, logType);
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  const content = line.endsWith("\n") ? line : line + "\n";

  try {
    fs.appendFileSync(logPath, content);
  } catch (error) {
    console.error(`Failed to write to log ${logPath}: ${error.message}`);
    throw error;
  }
}

/**
 * Read a project log file with optional size limit
 * @param {string} projectId - The project ID
 * @param {string} logType - The log type ('app', 'tunnel', 'server')
 * @param {number} maxBytes - Maximum bytes to read from end of file (default 20000)
 * @returns {string} The log content (last maxBytes of file, or empty string if file doesn't exist)
 */
export function readLog(projectId, logType, maxBytes = 20000) {
  if (!projectId || !logType) {
    throw new Error("projectId and logType are required");
  }

  ensureLogDir();
  const logPath = getLogFilePath(projectId, logType);

  try {
    const stat = fs.statSync(logPath);
    const start = Math.max(0, stat.size - maxBytes);
    const fd = fs.openSync(logPath, "r");
    const buffer = Buffer.alloc(stat.size - start);
    fs.readSync(fd, buffer, 0, buffer.length, start);
    fs.closeSync(fd);
    return buffer.toString("utf8");
  } catch (error) {
    // Return empty string if log file doesn't exist or can't be read
    if (error.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

/**
 * Clear all logs for a project (all log types)
 * @param {string} projectId - The project ID
 * @throws {Error} If deletion fails
 */
export function clearLogs(projectId) {
  if (!projectId) {
    throw new Error("projectId is required");
  }

  ensureLogDir();
  const logTypes = ["app", "tunnel", "server"];

  for (const logType of logTypes) {
    const logPath = getLogFilePath(projectId, logType);
    try {
      if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath);
      }
    } catch (error) {
      console.error(`Failed to delete log ${logPath}: ${error.message}`);
      throw error;
    }
  }
}
