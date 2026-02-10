import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_PATH = path.join(__dirname, "../../state.json");

/**
 * Load state from state.json file
 * Returns empty state object if file doesn't exist
 * @returns {Object} The state object with structure { projects: { projectId: { ... } } }
 * @throws {Error} If state.json exists but contains invalid JSON
 */
export function loadState() {
  try {
    const stateData = fs.readFileSync(STATE_PATH, "utf8");
    return JSON.parse(stateData);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist - return empty state
      return { projects: {} };
    } else if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in state file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Save state to state.json file atomically
 * Creates file if it doesn't exist
 * @param {Object} state - The state object to save
 * @throws {Error} If write operation fails
 */
export function saveState(state) {
  try {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } catch (error) {
    throw new Error(`Failed to save state: ${error.message}`);
  }
}

/**
 * Get state for a specific project
 * Returns empty object if project state doesn't exist
 * @param {string} projectId - The project ID
 * @returns {Object} The project state object (empty if doesn't exist)
 */
export function getProjectState(projectId) {
  const state = loadState();
  if (!state.projects) {
    state.projects = {};
  }
  if (!state.projects[projectId]) {
    state.projects[projectId] = {};
  }
  return state.projects[projectId];
}

/**
 * Set state for a specific project
 * Updates the entire project state object and saves to disk
 * @param {string} projectId - The project ID
 * @param {Object} stateObject - The state object to set for the project
 * @throws {Error} If save operation fails
 */
export function setProjectState(projectId, stateObject) {
  const state = loadState();
  if (!state.projects) {
    state.projects = {};
  }
  state.projects[projectId] = stateObject;
  saveState(state);
}
