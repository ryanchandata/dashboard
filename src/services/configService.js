import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateConfig } from "../config/validator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, "../../dashboard.config.json");

let cachedConfig = null;

/**
 * Load and cache the dashboard configuration from dashboard.config.json
 * @returns {Object} The configuration object
 * @throws {Error} If the config file is missing, invalid JSON, or invalid schema
 */
export function loadConfig() {
  try {
    const configData = fs.readFileSync(CONFIG_PATH, "utf8");
    cachedConfig = JSON.parse(configData);
    // Validate the configuration schema
    validateConfig(cachedConfig);
    return cachedConfig;
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`Configuration file not found at ${CONFIG_PATH}`);
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in configuration file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Reload configuration from disk (cache invalidation)
 * @returns {Object} The reloaded configuration object
 */
export function reloadConfig() {
  cachedConfig = null;
  return loadConfig();
}

/**
 * Get a single project by ID
 * @param {string} id - The project ID
 * @returns {Object|null} The project object or null if not found
 */
export function getProject(id) {
  if (!cachedConfig) {
    loadConfig();
  }

  if (!cachedConfig.projects || !Array.isArray(cachedConfig.projects)) {
    return null;
  }

  return cachedConfig.projects.find((p) => p.id === id) || null;
}

/**
 * Get all projects
 * @returns {Array} Array of all projects
 */
export function getAllProjects() {
  if (!cachedConfig) {
    loadConfig();
  }

  if (!cachedConfig.projects || !Array.isArray(cachedConfig.projects)) {
    return [];
  }

  return cachedConfig.projects;
}

/**
 * Get the cached configuration object
 * @returns {Object|null} The cached config or null if not yet loaded
 */
export function getConfig() {
  return cachedConfig;
}
