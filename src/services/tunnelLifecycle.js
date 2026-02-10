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
 * Start a tunnel by spawning cloudflared process
 * Detaches the process so it survives after parent exit
 * Parses trycloudflare.com URL from output
 * @param {Object} project - The project object with id, dir, tunnelPort
 * @returns {number} The PID of the spawned cloudflared process
 * @throws {Error} If project is invalid or spawn fails
 */
export function startTunnel(project) {
  if (!project || !project.id || !project.tunnelPort) {
    throw new Error("Invalid project object: missing id or tunnelPort");
  }

  // Check if tunnel is already running
  const projectState = stateService.getProjectState(project.id);
  if (isProcessAlive(projectState.tunnelPid)) {
    appendLog(
      project.id,
      "tunnel",
      `Tunnel already running with PID ${projectState.tunnelPid}`
    );
    return projectState.tunnelPid;
  }

  // Log tunnel start event
  appendLog(project.id, "tunnel", `START: cloudflared tunnel on port ${project.tunnelPort}`);

  // Spawn cloudflared detached process
  // cloudflared tunnel --url localhost:PORT
  const child = spawn("cloudflared", ["tunnel", "--url", `localhost:${project.tunnelPort}`], {
    shell: true,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Variable to track if we've captured the URL in this session
  let urlCaptured = false;

  // Attach output handlers for logging and URL parsing
  if (child.stdout) {
    child.stdout.on("data", (data) => {
      const output = data.toString();
      appendLog(project.id, "tunnel", output);

      // Parse trycloudflare.com URL from output
      // Look for pattern: https://XXXXXXX.trycloudflare.com
      if (!urlCaptured) {
        const urlMatch = output.match(/https:\/\/([a-zA-Z0-9-]+\.trycloudflare\.com)/);
        if (urlMatch) {
          const tunnelUrl = urlMatch[0];
          appendLog(project.id, "tunnel", `URL discovered: ${tunnelUrl}`);

          // Update state with tunnel URL
          const newState = {
            ...stateService.getProjectState(project.id),
            tunnelUrl,
            tunnelUrlDiscoveredAt: Date.now(),
          };
          stateService.setProjectState(project.id, newState);
          urlCaptured = true;
        }
      }
    });
  }
  if (child.stderr) {
    child.stderr.on("data", (data) => {
      appendLog(project.id, "tunnel", data.toString());
    });
  }

  // Unref so parent can exit
  child.unref();

  // Save state with tunnel PID and start time
  const newState = {
    ...stateService.getProjectState(project.id),
    tunnelPid: child.pid,
    tunnelStartedAt: Date.now(),
  };
  stateService.setProjectState(project.id, newState);

  appendLog(project.id, "tunnel", `Tunnel process started with PID ${child.pid}`);
  return child.pid;
}

/**
 * Stop a tunnel by killing its cloudflared process group
 * Attempts to kill the entire process group first (negative PID)
 * Falls back to killing the individual process if group kill fails
 * @param {Object} project - The project object with id
 * @returns {boolean} True if tunnel process was killed, false if no tunnel was running
 * @throws {Error} If project is invalid
 */
export function stopTunnel(project) {
  if (!project || !project.id) {
    throw new Error("Invalid project object: missing id");
  }

  const projectState = stateService.getProjectState(project.id);
  const pid = projectState.tunnelPid;

  if (!pid) {
    appendLog(project.id, "tunnel", "No running tunnel process to stop");
    return false;
  }

  appendLog(project.id, "tunnel", `STOP: Killing tunnel process group for PID ${pid}`);

  let killed = false;

  // Try to kill entire process group first (negative PID)
  try {
    process.kill(-pid, "SIGTERM");
    killed = true;
    appendLog(project.id, "tunnel", `Tunnel process group killed (SIGTERM)`);
  } catch {
    // Fallback: try to kill individual process
    try {
      process.kill(pid, "SIGTERM");
      killed = true;
      appendLog(project.id, "tunnel", `Tunnel process killed (SIGTERM)`);
    } catch (err) {
      appendLog(project.id, "tunnel", `Failed to kill tunnel process: ${err.message}`);
    }
  }

  // Clear tunnel state
  const newState = {
    ...stateService.getProjectState(project.id),
    tunnelPid: null,
    tunnelStartedAt: null,
    tunnelUrl: null,
    tunnelUrlDiscoveredAt: null,
  };
  stateService.setProjectState(project.id, newState);

  return killed;
}

/**
 * Check if a tunnel is currently running
 * @param {string} projectId - The project ID
 * @returns {boolean} True if tunnel process is alive
 * @throws {Error} If projectId is invalid
 */
export function isTunnelRunning(projectId) {
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const projectState = stateService.getProjectState(projectId);
  return isProcessAlive(projectState.tunnelPid);
}

/**
 * Get the tunnel URL for a project
 * Returns null if tunnel is not running or URL has not been discovered yet
 * @param {string} projectId - The project ID
 * @returns {string|null} The tunnel URL if available, null otherwise
 * @throws {Error} If projectId is invalid
 */
export function getTunnelUrl(projectId) {
  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const projectState = stateService.getProjectState(projectId);
  
  // Only return URL if tunnel is actually running
  if (isTunnelRunning(projectId)) {
    return projectState.tunnelUrl || null;
  }

  return null;
}
