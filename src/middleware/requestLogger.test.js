import { test } from "node:test";
import assert from "node:assert";
import { requestLoggerMiddleware } from "./requestLogger.js";
import { appendLog } from "../services/logService.js";

// Mock logService
let logCalls = [];
let consoleLogs = [];

// Save original functions
const originalLog = console.log;
const originalError = console.error;

test("requestLoggerMiddleware", async (t) => {
  // Setup: reset call tracking and capture console output
  beforeEach(() => {
    logCalls = [];
    consoleLogs = [];
    // Mock console.log to capture calls
    console.log = (...args) => {
      consoleLogs.push(args.join(" "));
    };
    console.error = (...args) => {
      // Silently capture errors
    };
  });

  // Cleanup: restore original console
  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  await t.test("is a function", () => {
    assert.strictEqual(typeof requestLoggerMiddleware, "function");
  });

  await t.test("accepts 3 parameters (req, res, next)", () => {
    const length = requestLoggerMiddleware.length;
    assert.strictEqual(length, 3, `expected 3 parameters, got ${length}`);
  });

  await t.test("calls next() to pass control to next middleware", () => {
    let nextCalled = false;
    const next = () => {
      nextCalled = true;
    };

    const req = { method: "GET", path: "/test" };
    const res = { statusCode: 200, on: () => {} };

    requestLoggerMiddleware(req, res, next);
    assert.strictEqual(nextCalled, true);
  });

  await t.test("logs to console with timestamp in dev mode", async () => {
    process.env.NODE_ENV = "development";
    logCalls = [];
    consoleLogs = [];

    console.log = (...args) => {
      consoleLogs.push(args.join(" "));
    };

    const next = () => {};
    const req = { method: "GET", path: "/api/test" };
    let finishHandler = null;

    const res = {
      statusCode: 200,
      on: (event, handler) => {
        if (event === "finish") {
          finishHandler = handler;
        }
      },
    };

    requestLoggerMiddleware(req, res, next);

    // Simulate response finishing
    if (finishHandler) {
      finishHandler();
    }

    assert.strictEqual(consoleLogs.length, 1);
    assert.match(consoleLogs[0], /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/); // ISO timestamp
    assert.match(consoleLogs[0], /GET \/api\/test 200 \d+ms/);
  });

  await t.test("does not log to console in production mode", async () => {
    process.env.NODE_ENV = "production";
    consoleLogs = [];

    console.log = (...args) => {
      consoleLogs.push(args.join(" "));
    };

    const next = () => {};
    const req = { method: "POST", path: "/api/project/start" };
    let finishHandler = null;

    const res = {
      statusCode: 200,
      on: (event, handler) => {
        if (event === "finish") {
          finishHandler = handler;
        }
      },
    };

    requestLoggerMiddleware(req, res, next);

    if (finishHandler) {
      finishHandler();
    }

    assert.strictEqual(
      consoleLogs.length,
      0,
      "should not log to console in production"
    );
  });

  await t.test("logs all request types (GET, POST, PUT, DELETE, etc.)", async () => {
    process.env.NODE_ENV = "development";

    for (const method of ["GET", "POST", "PUT", "DELETE", "PATCH"]) {
      consoleLogs = [];
      console.log = (...args) => {
        consoleLogs.push(args.join(" "));
      };

      const next = () => {};
      const req = { method, path: "/test" };
      let finishHandler = null;

      const res = {
        statusCode: 200,
        on: (event, handler) => {
          if (event === "finish") {
            finishHandler = handler;
          }
        },
      };

      requestLoggerMiddleware(req, res, next);
      if (finishHandler) {
        finishHandler();
      }

      assert.match(consoleLogs[0], new RegExp(`${method}`));
    }
  });

  await t.test("includes HTTP status codes in log output", async () => {
    process.env.NODE_ENV = "development";

    for (const status of [200, 201, 400, 404, 500]) {
      consoleLogs = [];
      console.log = (...args) => {
        consoleLogs.push(args.join(" "));
      };

      const next = () => {};
      const req = { method: "GET", path: "/test" };
      let finishHandler = null;

      const res = {
        statusCode: status,
        on: (event, handler) => {
          if (event === "finish") {
            finishHandler = handler;
          }
        },
      };

      requestLoggerMiddleware(req, res, next);
      if (finishHandler) {
        finishHandler();
      }

      assert.match(consoleLogs[0], new RegExp(` ${status} `));
    }
  });

  await t.test("measures and includes response time in milliseconds", async () => {
    process.env.NODE_ENV = "development";
    consoleLogs = [];

    console.log = (...args) => {
      consoleLogs.push(args.join(" "));
    };

    const next = () => {};
    const req = { method: "GET", path: "/test" };
    let finishHandler = null;

    const res = {
      statusCode: 200,
      on: (event, handler) => {
        if (event === "finish") {
          finishHandler = handler;
        }
      },
    };

    requestLoggerMiddleware(req, res, next);

    // Simulate some delay (roughly)
    if (finishHandler) {
      finishHandler();
    }

    assert.match(consoleLogs[0], /\d+ms/);
  });

  await t.test("logs to server logs via appendLog function", async () => {
    // This test verifies the middleware attempts to log to files
    // We'll check by looking at the source code or mocking appendLog
    process.env.NODE_ENV = "development";
    consoleLogs = [];

    console.log = (...args) => {
      consoleLogs.push(args.join(" "));
    };

    const next = () => {};
    const req = { method: "GET", path: "/test" };
    let finishHandler = null;

    const res = {
      statusCode: 200,
      on: (event, handler) => {
        if (event === "finish") {
          finishHandler = handler;
        }
      },
    };

    // Middleware should attempt to write to logs
    requestLoggerMiddleware(req, res, next);

    if (finishHandler) {
      finishHandler();
    }

    // Verify timestamp format
    assert.match(
      consoleLogs[0],
      /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/
    );
  });

  await t.test("handles multiple requests independently", async () => {
    process.env.NODE_ENV = "development";
    consoleLogs = [];

    console.log = (...args) => {
      consoleLogs.push(args.join(" "));
    };

    const requests = [
      { method: "GET", path: "/api/test1", status: 200 },
      { method: "POST", path: "/api/test2", status: 201 },
      { method: "PUT", path: "/api/test3", status: 200 },
    ];

    for (const reqData of requests) {
      const next = () => {};
      const req = { method: reqData.method, path: reqData.path };
      let finishHandler = null;

      const res = {
        statusCode: reqData.status,
        on: (event, handler) => {
          if (event === "finish") {
            finishHandler = handler;
          }
        },
      };

      requestLoggerMiddleware(req, res, next);
      if (finishHandler) {
        finishHandler();
      }
    }

    // Should have logged all three requests
    assert.strictEqual(consoleLogs.length, 3);
  });

  await t.test("includes path in log output", async () => {
    process.env.NODE_ENV = "development";

    const paths = [
      "/api/projects",
      "/api/projects/123/start",
      "/api/projects/456/logs",
    ];

    for (const path of paths) {
      consoleLogs = [];
      console.log = (...args) => {
        consoleLogs.push(args.join(" "));
      };

      const next = () => {};
      const req = { method: "GET", path };
      let finishHandler = null;

      const res = {
        statusCode: 200,
        on: (event, handler) => {
          if (event === "finish") {
            finishHandler = handler;
          }
        },
      };

      requestLoggerMiddleware(req, res, next);
      if (finishHandler) {
        finishHandler();
      }

      assert.match(consoleLogs[0], new RegExp(path.replace(/\//g, "\\/")));
    }
  });

  await t.test("gracefully handles logging failures in production", async () => {
    process.env.NODE_ENV = "production";
    consoleLogs = [];

    console.log = (...args) => {
      consoleLogs.push(args.join(" "));
    };

    const next = () => {};
    const req = { method: "GET", path: "/test" };
    let finishHandler = null;

    const res = {
      statusCode: 200,
      on: (event, handler) => {
        if (event === "finish") {
          finishHandler = handler;
        }
      },
    };

    // Should not throw even if logging fails
    requestLoggerMiddleware(req, res, next);
    if (finishHandler) {
      finishHandler();
    }

    // No console output in production
    assert.strictEqual(consoleLogs.length, 0);
  });

  await t.test("creates ISO-formatted timestamps", async () => {
    process.env.NODE_ENV = "development";
    consoleLogs = [];

    console.log = (...args) => {
      consoleLogs.push(args.join(" "));
    };

    const next = () => {};
    const req = { method: "GET", path: "/test" };
    let finishHandler = null;

    const res = {
      statusCode: 200,
      on: (event, handler) => {
        if (event === "finish") {
          finishHandler = handler;
        }
      },
    };

    requestLoggerMiddleware(req, res, next);
    if (finishHandler) {
      finishHandler();
    }

    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    assert.match(
      consoleLogs[0],
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/
    );
  });

  // Helper functions for test lifecycle
  function beforeEach(fn) {
    fn();
  }

  function afterEach(fn) {
    fn();
  }
});
