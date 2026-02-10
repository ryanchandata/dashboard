import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { config } from "../config/index.js";

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(config.dirs.state, "utf8"));
  } catch {
    return { projects: {} };
  }
}

function saveState(state) {
  fs.writeFileSync(config.dirs.state, JSON.stringify(state, null, 2));
}

function isAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function resolveProjectDir(project) {
  return path.resolve(config.dirs.root, project.dir);
}

function getProjectState(state, id) {
  if (!state.projects[id]) state.projects[id] = {};
  return state.projects[id];
}

function spawnDetached(command, cwd, onOutput) {
  const child = spawn(command, {
    cwd,
    shell: true,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (onOutput) {
    child.stdout.on("data", (data) => onOutput(data.toString()));
    child.stderr.on("data", (data) => onOutput(data.toString()));
  }
  child.unref();
  return child.pid;
}

function ensureLogDir() {
  if (!fs.existsSync(config.dirs.logs)) {
    fs.mkdirSync(config.dirs.logs, { recursive: true });
  }
}

function appendLog(id, type, message) {
  ensureLogDir();
  const logPath = path.join(config.dirs.logs, `${id}.${type}.log`);
  const line = `[${new Date().toISOString()}] ${message}`;
  fs.appendFileSync(logPath, line.endsWith("\n") ? line : line + "\n");
}

export function startTunnel(project) {
  const state = loadState();
  const pstate = getProjectState(state, project.id);
  if (isAlive(pstate.tunnelPid)) return pstate.tunnelPid;

  if (!fs.existsSync(config.dirs.tunnels)) {
    fs.mkdirSync(config.dirs.tunnels, { recursive: true });
  }
  const logPath = path.join(config.dirs.tunnels, `${project.id}.log`);

  appendLog(
    project.id,
    "tunnel",
    `START: cloudflared tunnel --url http://127.0.0.1:${project.port}`
  );
  const onOutput = (chunk) => {
    fs.appendFileSync(logPath, chunk);
    appendLog(project.id, "tunnel", chunk);
    const match = chunk.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
      pstate.tunnelUrl = match[0];
      saveState(state);
    }
  };

  const pid = spawnDetached(
    `cloudflared tunnel --url http://127.0.0.1:${project.port}`,
    resolveProjectDir(project),
    onOutput
  );

  pstate.tunnelPid = pid;
  pstate.tunnelStartedAt = Date.now();
  pstate.tunnelUrl = pstate.tunnelUrl || null;
  saveState(state);
  return pid;
}

export function stopTunnel(project) {
  const state = loadState();
  const pstate = getProjectState(state, project.id);
  if (!pstate.tunnelPid) return false;

  appendLog(project.id, "tunnel", `STOP: pid ${pstate.tunnelPid}`);
  try {
    process.kill(-pstate.tunnelPid);
  } catch {
    try {
      process.kill(pstate.tunnelPid);
    } catch {}
  }

  pstate.tunnelPid = null;
  pstate.tunnelStartedAt = null;
  saveState(state);
  return true;
}
