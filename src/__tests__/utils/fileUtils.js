/**
 * Test utilities for mocking file system operations
 * Provides utilities to mock fs module in tests
 */

import fs from "fs";
import path from "path";

/**
 * Create a temporary test file
 */
export function createTempFile(dir, filename, content = "") {
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, content, "utf8");
  return filepath;
}

/**
 * Create a temporary test directory
 */
export function createTempDir(parentDir, dirname) {
  const dirpath = path.join(parentDir, dirname);
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
  return dirpath;
}

/**
 * Clean up temporary test files
 */
export function cleanupTempFile(filepath) {
  try {
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error(`Failed to cleanup temp file ${filepath}:`, error.message);
  }
}

/**
 * Clean up temporary test directory
 */
export function cleanupTempDir(dirpath) {
  try {
    if (fs.existsSync(dirpath)) {
      fs.rmSync(dirpath, { recursive: true, force: true });
    }
  } catch (error) {
    console.error(`Failed to cleanup temp dir ${dirpath}:`, error.message);
  }
}

/**
 * Mock fs.readFileSync
 */
export function mockReadFileSync(mockImplementation) {
  const original = fs.readFileSync;
  fs.readFileSync = mockImplementation;
  return () => {
    fs.readFileSync = original;
  };
}

/**
 * Mock fs.writeFileSync
 */
export function mockWriteFileSync(mockImplementation) {
  const original = fs.writeFileSync;
  fs.writeFileSync = mockImplementation;
  return () => {
    fs.writeFileSync = original;
  };
}

/**
 * Create a mock JSON file reader
 */
export function createMockJsonReader(data) {
  return () => JSON.stringify(data);
}

/**
 * Create a mock JSON file writer
 */
export function createMockJsonWriter() {
  const written = [];
  return {
    write: (data) => {
      written.push(JSON.parse(JSON.stringify(data)));
    },
    getWritten: () => written,
    clear: () => {
      written.length = 0;
    },
  };
}
