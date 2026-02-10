import { test } from "node:test";
import assert from "node:assert";
import { errorHandler, notFoundHandler } from "../middleware/errorHandler.js";

test("errorHandler - is a function", () => {
  assert.equal(typeof errorHandler, "function");
});

test("errorHandler - accepts 4 parameters (error middleware)", () => {
  assert.equal(errorHandler.length, 4);
});

test("errorHandler - catches error and returns JSON response", () => {
  const err = new Error("Test error");
  err.status = 500;
  
  const req = { path: "/test", method: "GET" };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    },
  };
  const next = () => {};
  
  errorHandler(err, req, res, next);
  
  assert.equal(res.statusCode, 500);
  assert.equal(res.jsonData.error, "Test error");
  assert.equal(res.jsonData.status, 500);
});

test("errorHandler - uses status from error object", () => {
  const err = new Error("Not found");
  err.status = 404;
  
  const req = { path: "/test", method: "GET" };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    },
  };
  const next = () => {};
  
  errorHandler(err, req, res, next);
  
  assert.equal(res.statusCode, 404);
});

test("errorHandler - defaults to 500 status if not specified", () => {
  const err = new Error("Unknown error");
  
  const req = { path: "/test", method: "GET" };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    },
  };
  const next = () => {};
  
  errorHandler(err, req, res, next);
  
  assert.equal(res.statusCode, 500);
});

test("errorHandler - includes development details when NODE_ENV is not production", () => {
  const originalEnv = process.env.NODE_ENV;
  delete process.env.NODE_ENV; // Simulate development
  
  const err = new Error("Dev error");
  err.status = 500;
  
  const req = { path: "/api/test", method: "POST" };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    },
  };
  const next = () => {};
  
  errorHandler(err, req, res, next);
  
  assert(res.jsonData.details);
  assert.equal(res.jsonData.details.path, "/api/test");
  assert.equal(res.jsonData.details.method, "POST");
  assert(res.jsonData.details.timestamp);
  assert(res.jsonData.stack);
  
  process.env.NODE_ENV = originalEnv;
});

test("errorHandler - excludes development details when NODE_ENV is production", () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  
  const err = new Error("Prod error");
  err.status = 500;
  
  const req = { path: "/api/test", method: "POST" };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    },
  };
  const next = () => {};
  
  errorHandler(err, req, res, next);
  
  assert(!res.jsonData.details);
  assert(!res.jsonData.stack);
  
  process.env.NODE_ENV = originalEnv;
});

test("errorHandler - includes stack trace in development mode", () => {
  const originalEnv = process.env.NODE_ENV;
  delete process.env.NODE_ENV;
  
  const err = new Error("Stack trace test");
  err.status = 500;
  
  const req = { path: "/test", method: "GET" };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    },
  };
  const next = () => {};
  
  errorHandler(err, req, res, next);
  
  assert(res.jsonData.stack);
  assert(res.jsonData.stack.includes("Stack trace test"));
  
  process.env.NODE_ENV = originalEnv;
});

test("errorHandler - logs error to console", () => {
  let logged = false;
  const originalError = console.error;
  console.error = (msg) => {
    logged = true;
  };
  
  const err = new Error("Log test");
  err.status = 500;
  
  const req = { path: "/test", method: "GET" };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    },
  };
  const next = () => {};
  
  errorHandler(err, req, res, next);
  
  assert(logged);
  console.error = originalError;
});

test("errorHandler - uses statusCode as fallback to status", () => {
  const err = new Error("Fallback test");
  err.statusCode = 403;
  
  const req = { path: "/test", method: "GET" };
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    },
  };
  const next = () => {};
  
  errorHandler(err, req, res, next);
  
  assert.equal(res.statusCode, 403);
});

test("notFoundHandler - is a function", () => {
  assert.equal(typeof notFoundHandler, "function");
});

test("notFoundHandler - accepts 3 parameters", () => {
  assert.equal(notFoundHandler.length, 3);
});

test("notFoundHandler - creates 404 error and calls next", () => {
  const req = { path: "/unknown", method: "GET" };
  const res = {};
  let nextCalled = false;
  let passedError = null;
  
  const next = (err) => {
    nextCalled = true;
    passedError = err;
  };
  
  notFoundHandler(req, res, next);
  
  assert(nextCalled);
  assert(passedError instanceof Error);
  assert.equal(passedError.status, 404);
  assert(passedError.message.includes("/unknown"));
});

test("notFoundHandler - includes method and path in error message", () => {
  const req = { path: "/api/missing", method: "DELETE" };
  const res = {};
  let passedError = null;
  
  const next = (err) => {
    passedError = err;
  };
  
  notFoundHandler(req, res, next);
  
  assert(passedError.message.includes("DELETE"));
  assert(passedError.message.includes("/api/missing"));
});

test("notFoundHandler - creates proper error object with 404 status", () => {
  const req = { path: "/test", method: "POST" };
  const res = {};
  let passedError = null;
  
  const next = (err) => {
    passedError = err;
  };
  
  notFoundHandler(req, res, next);
  
  assert(passedError.status === 404);
  assert.equal(typeof passedError.message, "string");
  assert(passedError.message.length > 0);
});
