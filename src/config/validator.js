/**
 * Configuration validator for dashboard.config.json
 * Validates the schema and required fields for dashboard and project configurations
 */

/**
 * Validate the dashboard configuration
 * @param {Object} config - The configuration object to validate
 * @throws {Error} If validation fails with a clear error message
 */
export function validateConfig(config) {
  if (config === null || config === undefined || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Configuration must be a valid JSON object");
  }

  // Validate port
  if (config.port === undefined) {
    throw new Error('Configuration missing required field: "port"');
  }

  if (typeof config.port !== "number") {
    throw new Error(
      `Invalid configuration: "port" must be a number, got ${typeof config.port}`
    );
  }

  if (!Number.isInteger(config.port) || config.port < 0 || config.port > 65535) {
    throw new Error(
      `Invalid configuration: "port" must be a valid port number (0-65535), got ${config.port}`
    );
  }

  // Validate projects array
  if (!Array.isArray(config.projects)) {
    throw new Error(
      `Invalid configuration: "projects" must be an array, got ${
        config.projects === undefined
          ? "undefined"
          : typeof config.projects
      }`
    );
  }

  // Validate each project
  config.projects.forEach((project, index) => {
    validateProject(project, index);
  });
}

/**
 * Validate a single project configuration
 * @param {Object} project - The project object to validate
 * @param {number} index - The project index (for error messages)
 * @throws {Error} If validation fails with a clear error message
 */
export function validateProject(project, index) {
  if (!project || typeof project !== "object") {
    throw new Error(
      `Invalid configuration: project at index ${index} must be a valid object`
    );
  }

  const requiredFields = ["id", "name", "dir", "start", "port"];

  for (const field of requiredFields) {
    if (project[field] === undefined) {
      throw new Error(
        `Invalid configuration: project at index ${index} missing required field: "${field}"`
      );
    }
  }

  // Validate id is a string
  if (typeof project.id !== "string" || project.id.trim() === "") {
    throw new Error(
      `Invalid configuration: project at index ${index} "id" must be a non-empty string`
    );
  }

  // Validate name is a string
  if (typeof project.name !== "string" || project.name.trim() === "") {
    throw new Error(
      `Invalid configuration: project at index ${index} "name" must be a non-empty string`
    );
  }

  // Validate dir is a string
  if (typeof project.dir !== "string" || project.dir.trim() === "") {
    throw new Error(
      `Invalid configuration: project at index ${index} "dir" must be a non-empty string`
    );
  }

  // Validate start is a string
  if (typeof project.start !== "string" || project.start.trim() === "") {
    throw new Error(
      `Invalid configuration: project at index ${index} "start" must be a non-empty string`
    );
  }

  // Validate port is a number
  if (typeof project.port !== "number") {
    throw new Error(
      `Invalid configuration: project at index ${index} "port" must be a number, got ${typeof project.port}`
    );
  }

  if (
    !Number.isInteger(project.port) ||
    project.port < 0 ||
    project.port > 65535
  ) {
    throw new Error(
      `Invalid configuration: project at index ${index} "port" must be a valid port number (0-65535), got ${project.port}`
    );
  }
}
