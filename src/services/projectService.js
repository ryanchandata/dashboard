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

export function startProject(project) {
  const state = loadState();
  const pstate = getProjectState(state, project.id);
  if (isAlive(pstate.pid)) return pstate.pid;

  appendLog(project.id, "app", `START: ${project.start}`);
  const pid = spawnDetached(project.start, resolveProjectDir(project), (chunk) => {
    appendLog(project.id, "app", chunk);
  });
  pstate.pid = pid;
  pstate.startedAt = Date.now();
  saveState(state);
  return pid;
}

export function stopProject(project) {
  const state = loadState();
  const pstate = getProjectState(state, project.id);
  if (!pstate.pid) return false;

  appendLog(project.id, "app", `STOP: pid ${pstate.pid}`);
  try {
    process.kill(-pstate.pid);
  } catch {
    try {
      process.kill(pstate.pid);
    } catch {}
  }
  pstate.pid = null;
  pstate.startedAt = null;
  saveState(state);
  return true;
}

export function getProjectSnapshot(project) {
  const state = loadState();
  const pstate = getProjectState(state, project.id);
  return {
    id: project.id,
    name: project.name,
    port: project.port,
    running: isAlive(pstate.pid),
    pid: isAlive(pstate.pid) ? pstate.pid : null,
    startedAt: isAlive(pstate.pid) ? pstate.startedAt : null,
    tunnelRunning: isAlive(pstate.tunnelPid),
    tunnelPid: isAlive(pstate.tunnelPid) ? pstate.tunnelPid : null,
    tunnelStartedAt: isAlive(pstate.tunnelPid) ? pstate.tunnelStartedAt : null,
    tunnelUrl: pstate.tunnelUrl || null,
  };
}

export function readLog(id, type, maxBytes = 20000) {
  ensureLogDir();
  const logPath = path.join(config.dirs.logs, `${id}.${type}.log`);
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
