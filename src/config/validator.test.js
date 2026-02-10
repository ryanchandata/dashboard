import { test } from "node:test";
import assert from "node:assert";
import { validateConfig, validateProject } from "./validator.js";

test("validator - validateConfig", async (t) => {
  await t.test("should pass with valid configuration", () => {
    const validConfig = {
      port: 3000,
      projects: [
        {
          id: "project1",
          name: "Project 1",
          dir: "/path/to/project1",
          start: "npm start",
          port: 8000,
        },
      ],
    };

    assert.doesNotThrow(() => {
      validateConfig(validConfig);
    });
  });

  await t.test("should pass with multiple valid projects", () => {
    const validConfig = {
      port: 3000,
      projects: [
        {
          id: "proj1",
          name: "Project 1",
          dir: "/path1",
          start: "npm start",
          port: 8000,
        },
        {
          id: "proj2",
          name: "Project 2",
          dir: "/path2",
          start: "yarn dev",
          port: 8001,
        },
      ],
    };

    assert.doesNotThrow(() => {
      validateConfig(validConfig);
    });
  });

  await t.test("should pass with empty projects array", () => {
    const validConfig = {
      port: 3000,
      projects: [],
    };

    assert.doesNotThrow(() => {
      validateConfig(validConfig);
    });
  });

  await t.test("should throw when config is not an object", () => {
    assert.throws(
      () => validateConfig(null),
      /Configuration must be a valid JSON object/
    );

    assert.throws(
      () => validateConfig("not an object"),
      /Configuration must be a valid JSON object/
    );

    assert.throws(
      () => validateConfig([]),
      /Configuration must be a valid JSON object/
    );
  });

  await t.test("should throw when port is missing", () => {
    const invalidConfig = {
      projects: [],
    };

    assert.throws(
      () => validateConfig(invalidConfig),
      /Configuration missing required field: "port"/
    );
  });

  await t.test("should throw when port is not a number", () => {
    const invalidConfig = {
      port: "3000",
      projects: [],
    };

    assert.throws(
      () => validateConfig(invalidConfig),
      /port" must be a number/
    );
  });

  await t.test("should throw when port is not an integer", () => {
    const invalidConfig = {
      port: 3000.5,
      projects: [],
    };

    assert.throws(
      () => validateConfig(invalidConfig),
      /port" must be a valid port number/
    );
  });

  await t.test("should throw when port is negative", () => {
    const invalidConfig = {
      port: -1,
      projects: [],
    };

    assert.throws(
      () => validateConfig(invalidConfig),
      /port" must be a valid port number/
    );
  });

  await t.test("should throw when port is greater than 65535", () => {
    const invalidConfig = {
      port: 65536,
      projects: [],
    };

    assert.throws(
      () => validateConfig(invalidConfig),
      /port" must be a valid port number/
    );
  });

  await t.test("should throw when projects is not an array", () => {
    assert.throws(
      () => validateConfig({ port: 3000, projects: "not an array" }),
      /projects" must be an array/
    );

    assert.throws(
      () => validateConfig({ port: 3000, projects: { id: "test" } }),
      /projects" must be an array/
    );

    assert.throws(
      () => validateConfig({ port: 3000 }),
      /projects" must be an array/
    );
  });

  await t.test("should throw when projects array contains invalid project", () => {
    const invalidConfig = {
      port: 3000,
      projects: [
        {
          id: "project1",
          name: "Project 1",
          dir: "/path",
          start: "npm start",
          port: 8000,
        },
        {
          id: "project2",
          // missing 'name' field
          dir: "/path2",
          start: "npm start",
          port: 8001,
        },
      ],
    };

    assert.throws(
      () => validateConfig(invalidConfig),
      /project at index 1 missing required field: "name"/
    );
  });
});

test("validator - validateProject", async (t) => {
  await t.test("should pass with valid project", () => {
    const validProject = {
      id: "test-project",
      name: "Test Project",
      dir: "/path/to/project",
      start: "npm start",
      port: 8000,
    };

    assert.doesNotThrow(() => {
      validateProject(validProject, 0);
    });
  });

  await t.test("should throw when project is not an object", () => {
    assert.throws(
      () => validateProject(null, 0),
      /project at index 0 must be a valid object/
    );

    assert.throws(
      () => validateProject("not an object", 0),
      /project at index 0 must be a valid object/
    );
  });

  await t.test("should throw when id is missing", () => {
    const invalidProject = {
      name: "Project",
      dir: "/path",
      start: "npm start",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 2),
      /project at index 2 missing required field: "id"/
    );
  });

  await t.test("should throw when id is empty string", () => {
    const invalidProject = {
      id: "",
      name: "Project",
      dir: "/path",
      start: "npm start",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 "id" must be a non-empty string/
    );
  });

  await t.test("should throw when id is not a string", () => {
    const invalidProject = {
      id: 123,
      name: "Project",
      dir: "/path",
      start: "npm start",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 "id" must be a non-empty string/
    );
  });

  await t.test("should throw when name is missing", () => {
    const invalidProject = {
      id: "project",
      dir: "/path",
      start: "npm start",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 missing required field: "name"/
    );
  });

  await t.test("should throw when name is empty string", () => {
    const invalidProject = {
      id: "project",
      name: "",
      dir: "/path",
      start: "npm start",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 "name" must be a non-empty string/
    );
  });

  await t.test("should throw when dir is missing", () => {
    const invalidProject = {
      id: "project",
      name: "Project",
      start: "npm start",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 missing required field: "dir"/
    );
  });

  await t.test("should throw when dir is empty string", () => {
    const invalidProject = {
      id: "project",
      name: "Project",
      dir: "",
      start: "npm start",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 "dir" must be a non-empty string/
    );
  });

  await t.test("should throw when start is missing", () => {
    const invalidProject = {
      id: "project",
      name: "Project",
      dir: "/path",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 missing required field: "start"/
    );
  });

  await t.test("should throw when start is empty string", () => {
    const invalidProject = {
      id: "project",
      name: "Project",
      dir: "/path",
      start: "",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 "start" must be a non-empty string/
    );
  });

  await t.test("should throw when port is missing", () => {
    const invalidProject = {
      id: "project",
      name: "Project",
      dir: "/path",
      start: "npm start",
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 missing required field: "port"/
    );
  });

  await t.test("should throw when port is not a number", () => {
    const invalidProject = {
      id: "project",
      name: "Project",
      dir: "/path",
      start: "npm start",
      port: "8000",
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 "port" must be a number/
    );
  });

  await t.test("should throw when port is not an integer", () => {
    const invalidProject = {
      id: "project",
      name: "Project",
      dir: "/path",
      start: "npm start",
      port: 8000.5,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 "port" must be a valid port number/
    );
  });

  await t.test("should throw when port is negative", () => {
    const invalidProject = {
      id: "project",
      name: "Project",
      dir: "/path",
      start: "npm start",
      port: -1,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 "port" must be a valid port number/
    );
  });

  await t.test("should throw when port is greater than 65535", () => {
    const invalidProject = {
      id: "project",
      name: "Project",
      dir: "/path",
      start: "npm start",
      port: 65536,
    };

    assert.throws(
      () => validateProject(invalidProject, 0),
      /project at index 0 "port" must be a valid port number/
    );
  });

  await t.test("should include correct index in error message", () => {
    const invalidProject = {
      id: "project",
      // missing name
      dir: "/path",
      start: "npm start",
      port: 8000,
    };

    assert.throws(
      () => validateProject(invalidProject, 5),
      /project at index 5 missing required field: "name"/
    );
  });
});
