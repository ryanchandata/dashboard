import { Router } from "express";
import { getAllProjects, getProject } from "../services/configService.js";
import * as projectLifecycle from "../services/projectLifecycle.js";
import * as tunnelLifecycle from "../services/tunnelLifecycle.js";
import * as stateService from "../services/stateService.js";
import * as logService from "../services/logService.js";

const router = Router();

/**
 * Build project status response with running, tunnelRunning, tunnelUrl, pid
 * @param {Object} project - Project config object
 * @returns {Object} Project with status fields
 */
function buildProjectStatus(project) {
  const projectId = project.id;
  const projectState = stateService.getProjectState(projectId);
  
  return {
    id: project.id,
    name: project.name,
    dir: project.dir,
    start: project.start,
    port: project.port,
    tunnelPort: project.port, // Expose port as tunnelPort for API consistency
    running: projectLifecycle.isProjectRunning(projectId),
    pid: projectState.pid || null,
    startedAt: projectState.startedAt || null,
    tunnelRunning: tunnelLifecycle.isTunnelRunning(projectId),
    tunnelPid: projectState.tunnelPid || null,
    tunnelUrl: tunnelLifecycle.getTunnelUrl(projectId),
    tunnelStartedAt: projectState.tunnelStartedAt || null,
  };
}

// GET /api/projects - List all projects with their current state
router.get("/", (req, res) => {
  try {
    const projects = getAllProjects().map(buildProjectStatus);
    res.status(200).json({ projects });
  } catch (err) {
    res.status(500).json({ error: "Failed to load projects", message: err.message });
  }
});

// GET /api/projects/:id - Get a single project with its current state
router.get("/:id", (req, res) => {
  try {
    const project = getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const projectStatus = buildProjectStatus(project);
    res.status(200).json({ project: projectStatus });
  } catch (err) {
    res.status(500).json({ error: "Failed to load project", message: err.message });
  }
});

// POST /api/projects/:id/start - Start a project
router.post("/:id/start", (req, res) => {
  try {
    const project = getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    projectLifecycle.startProject(project);
    const projectStatus = buildProjectStatus(project);
    res.status(200).json({ project: projectStatus });
  } catch (err) {
    res.status(500).json({ error: "Failed to start project", message: err.message });
  }
});

// POST /api/projects/:id/stop - Stop a project
router.post("/:id/stop", (req, res) => {
  try {
    const project = getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    projectLifecycle.stopProject(project);
    const projectStatus = buildProjectStatus(project);
    res.status(200).json({ project: projectStatus });
  } catch (err) {
    res.status(500).json({ error: "Failed to stop project", message: err.message });
  }
});

// POST /api/projects/:id/tunnel-start - Start a tunnel for a project
router.post("/:id/tunnel-start", (req, res) => {
  try {
    const project = getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Ensure project has tunnelPort field for tunnel lifecycle service
    const projectWithTunnelPort = {
      ...project,
      tunnelPort: project.port || project.tunnelPort,
    };

    tunnelLifecycle.startTunnel(projectWithTunnelPort);
    const projectStatus = buildProjectStatus(project);
    res.status(200).json({ project: projectStatus });
  } catch (err) {
    res.status(500).json({ error: "Failed to start tunnel", message: err.message });
  }
});

// POST /api/projects/:id/tunnel-stop - Stop a tunnel for a project
router.post("/:id/tunnel-stop", (req, res) => {
  try {
    const project = getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    tunnelLifecycle.stopTunnel(project);
    const projectStatus = buildProjectStatus(project);
    res.status(200).json({ project: projectStatus });
  } catch (err) {
    res.status(500).json({ error: "Failed to stop tunnel", message: err.message });
  }
});

// GET /api/projects/:id/logs - Read project logs by type
router.get("/:id/logs", (req, res) => {
  try {
    const project = getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Query parameters: type (app or tunnel) and maxBytes (default 20KB)
    const logType = req.query.type || "app";
    const maxBytes = req.query.maxBytes ? parseInt(req.query.maxBytes, 10) : 20000;

    // Validate logType
    if (!["app", "tunnel"].includes(logType)) {
      return res.status(400).json({ error: "Invalid log type. Must be 'app' or 'tunnel'." });
    }

    // Validate maxBytes if provided
    if (isNaN(maxBytes) || maxBytes < 0) {
      return res.status(400).json({ error: "maxBytes must be a non-negative number" });
    }

    const logContent = logService.readLog(req.params.id, logType, maxBytes);
    res.status(200).json({ logs: logContent });
  } catch (err) {
    res.status(500).json({ error: "Failed to read logs", message: err.message });
  }
});

export default router;
