/**
 * Test fixtures for dashboard testing
 * Provides common mock data and test configurations
 */

/**
 * Mock project configuration
 */
export const mockProjects = {
  project1: {
    id: "project1",
    name: "Test Project 1",
    dir: "/home/user/projects/project1",
    start: "npm start",
    stop: "npm stop",
  },
  project2: {
    id: "project2",
    name: "Test Project 2",
    dir: "/home/user/projects/project2",
    start: "npm run dev",
  },
};

/**
 * Mock dashboard configuration
 */
export const mockDashboardConfig = {
  port: 8787,
  env: "development",
  logDir: "./logs",
  stateFile: "./state.json",
  projects: mockProjects,
};

/**
 * Mock state object
 */
export const mockState = {
  projects: {
    project1: {
      isRunning: false,
      pid: null,
      lastStarted: null,
      lastStopped: null,
    },
    project2: {
      isRunning: true,
      pid: 12345,
      lastStarted: Date.now(),
      lastStopped: null,
    },
  },
  tunnels: {
    tunnel1: {
      isRunning: false,
      pid: null,
    },
  },
};

/**
 * Mock request object
 */
export function createMockRequest(options = {}) {
  return {
    method: options.method || "GET",
    path: options.path || "/",
    headers: options.headers || {},
    query: options.query || {},
    params: options.params || {},
    body: options.body || {},
    ...options,
  };
}

/**
 * Mock response object
 */
export function createMockResponse() {
  const response = {
    statusCode: 200,
    headers: {},
    body: null,
    sentData: null,
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      this.sentData = data;
      return this;
    },
    send: function (data) {
      this.sentData = data;
      return this;
    },
    set: function (key, value) {
      this.headers[key] = value;
      return this;
    },
  };
  return response;
}

/**
 * Mock next function for middleware
 */
export function createMockNext() {
  const next = function () {};
  next.called = false;
  next.calledWith = null;
  next.error = null;

  return function (error) {
    next.called = true;
    if (error) {
      next.error = error;
    }
    next.calledWith = error;
  };
}

/**
 * Default environment variables for testing
 */
export const testEnvVars = {
  NODE_ENV: "test",
  PORT: "8787",
  LOG_DIR: "./logs",
  STATE_FILE: "./state.json",
};

/**
 * Create a test context with common setup
 */
export function createTestContext() {
  return {
    config: mockDashboardConfig,
    state: mockState,
    request: createMockRequest(),
    response: createMockResponse(),
    next: createMockNext(),
  };
}
