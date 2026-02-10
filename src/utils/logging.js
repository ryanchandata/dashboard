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
 * Append a timestamped message to a project log file
 * @param {string} projectId - The project ID
 * @param {string} type - Log type (e.g., 'app', 'tunnel')
 * @param {string} message - The message to log
 * @throws {Error} If write fails
 */
export function appendLog(projectId, type, message) {
  ensureLogDir();
  const logPath = path.join(config.dirs.logs, `${projectId}.${type}.log`);
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  const content = line.endsWith("\n") ? line : line + "\n";

  try {
    fs.appendFileSync(logPath, content);
  } catch (error) {
    console.error(
      `Failed to write to log ${logPath}: ${error.message}`
    );
    throw error;
  }
}

/**
 * Read a project log file with optional size limit
 * @param {string} projectId - The project ID
 * @param {string} type - Log type (e.g., 'app', 'tunnel')
 * @param {number} maxBytes - Maximum bytes to read (default 20000)
 * @returns {string} The log content
 */
export function readLog(projectId, type, maxBytes = 20000) {
  ensureLogDir();
  const logPath = path.join(config.dirs.logs, `${projectId}.${type}.log`);

  try {
    const stat = fs.statSync(logPath);
    const start = Math.max(0, stat.size - maxBytes);
    const fd = fs.openSync(logPath, "r");
    const buffer = Buffer.alloc(stat.size - start);
    fs.readSync(fd, buffer, 0, buffer.length, start);
    fs.closeSync(fd);
    return buffer.toString("utf8");
  } catch {
    return "";
  }
}
