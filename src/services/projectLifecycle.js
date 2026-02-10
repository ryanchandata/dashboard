import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/index.js";
import * as stateService from "./stateService.js";
import { appendLog } from "../utils/logging.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if a process with the given PID is alive
 * @param {number} pid - The process ID
 * @returns {boolean} True if process is alive, false otherwise
 */
export function isProcessAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Start a project by spawning its start command
 * Detaches the process so it survives after parent exit
 * @param {Object} project - The project object with id, name, dir, start command
 * @returns {number} The PID of the spawned process
 * @throws {Error} If project is invalid or spawn fails
 */
export function startProject(project) {
  if (!project || !project.id || !project.start || !project.dir) {
    throw new Error("Invalid project object: missing id, start command, or dir");
  }

  // Check if already running
  const projectState = stateService.getProjectState(project.id);
  if (isProcessAlive(projectState.pid)) {
    appendLog(
      project.id,
      "app",
      `Project already running with PID ${projectState.pid}`
    );
    return projectState.pid;
  }

  // Log start event
  appendLog(project.id, "app", `START: ${project.start}`);

  // Resolve project directory
  const projectDir = path.resolve(config.dirs.root, project.dir);

  // Spawn detached process
  const child = spawn(project.start, {
    cwd: projectDir,
    shell: true,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Attach output handlers for logging
  if (child.stdout) {
    child.stdout.on("data", (data) => {
      appendLog(project.id, "app", data.toString());
    });
  }
  if (child.stderr) {
    child.stderr.on("data", (data) => {
      appendLog(project.id, "app", data.toString());
    });
  }

  // Unref so parent can exit
  child.unref();

  // Save state
  const newState = {
    pid: child.pid,
    startedAt: Date.now(),
  };
  stateService.setProjectState(project.id, {
    ...stateService.getProjectState(project.id),
    ...newState,
  });

  appendLog(project.id, "app", `Process started with PID ${child.pid}`);
  return child.pid;
}

/**
 * Stop a project by killing its process group
 * Attempts to kill the entire process group first (negative PID)
 * Falls back to killing the individual process if group kill fails
 * @param {Object} project - The project object with id
 * @returns {boolean} True if process was killed, false if no process was running
 * @throws {Error} If project is invalid
 */
export function stopProject(project) {
  if (!project || !project.id) {
    throw new Error("Invalid project object: missing id");
  }

  const projectState = stateService.getProjectState(project.id);
  const pid = projectState.pid;

  if (!pid) {
    appendLog(project.id, "app", "No running process to stop");
    return false;
  }

  appendLog(project.id, "app", `STOP: Killing process group for PID ${pid}`);

  let killed = false;

  // Try to kill entire process group first (negative PID)
  try {
    process.kill(-pid, "SIGTERM");
    killed = true;
    appendLog(project.id, "app", `Process group killed (SIGTERM)`);
  } catch {
    // Fallback: try to kill individual process
    try {
      process.kill(pid, "SIGTERM");
      killed = true;
      appendLog(project.id, "app", `Process killed (SIGTERM)`);
    } catch (err) {
      appendLog(project.id, "app", `Failed to kill process: ${err.message}`);
    }
  }

  // Clear state
  const newState = {
    ...stateService.getProjectState(project.id),
    pid: null,
    startedAt: null,
  };
  stateService.setProjectState(project.id, newState);

  return killed;
}

/**
 * Check if a project is currently running
 * @param {string} projectId - The project ID
 * @returns {boolean} True if project process is alive
 */
export function isProjectRunning(projectId) {
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const projectState = stateService.getProjectState(projectId);
  return isProcessAlive(projectState.pid);
}

/**
 * Get the PID of a running project
 * @param {string} projectId - The project ID
 * @returns {number|null} The PID if process is alive, null otherwise
 */
export function getProjectPid(projectId) {
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const projectState = stateService.getProjectState(projectId);
  const pid = projectState.pid;

  if (isProcessAlive(pid)) {
    return pid;
  }

  return null;
}
