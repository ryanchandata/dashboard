import { test } from "node:test";
import assert from "node:assert";
import { errorHandler, loggerMiddleware } from "../middleware/index.js";

test("errorHandler is a function", () => {
  assert.equal(typeof errorHandler, "function", "errorHandler should be a function");
});

test("errorHandler accepts 4 parameters", () => {
  assert.equal(
    errorHandler.length,
    4,
    "errorHandler should accept error, req, res, next"
  );
});

test("loggerMiddleware is a function", () => {
  assert.equal(typeof loggerMiddleware, "function", "loggerMiddleware should be a function");
});

test("loggerMiddleware accepts 3 parameters", () => {
  assert.equal(
    loggerMiddleware.length,
    3,
    "loggerMiddleware should accept req, res, next"
  );
});
