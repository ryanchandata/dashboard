import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "../../");

// Validate and parse PORT environment variable
function getPort() {
  const envPort = process.env.PORT;
  if (envPort) {
    const parsed = parseInt(envPort, 10);
    if (isNaN(parsed) || parsed < 0 || parsed > 65535) {
      console.warn(`Invalid PORT ${envPort}, using default 3000`);
      return 3000;
    }
    return parsed;
  }
  return 3000;
}

// Get log directory from environment or use default
function getLogDir() {
  return process.env.LOG_DIR || path.join(rootDir, "logs");
}

export const config = {
  port: getPort(),
  env: process.env.NODE_ENV || "development",
  dirs: {
    root: rootDir,
    config: path.join(rootDir, "dashboard.config.json"),
    state: path.join(rootDir, "state.json"),
    public: path.join(rootDir, "public"),
    logs: getLogDir(),
    tunnels: path.join(rootDir, "tunnels"),
  },
};

export function loadProjectConfig() {
  try {
    const configPath = config.dirs.config;
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (err) {
    console.error("Failed to load project config:", err.message);
    return { projects: [], port: config.port };
  }
}
