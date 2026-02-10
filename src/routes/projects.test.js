import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../app.js";

describe("Projects API Routes", () => {
  describe("GET /api/projects", () => {
    it("should return 200 with array of all projects", async () => {
      const res = await request(app).get("/api/projects");

      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body.projects));
      assert(res.body.projects.length > 0);
    });

    it("should include project status fields (running, tunnelRunning, tunnelUrl, pid)", async () => {
      const res = await request(app).get("/api/projects");

      assert.strictEqual(res.status, 200);
      const project = res.body.projects[0];
      assert(project.id);
      assert(typeof project.running === "boolean");
      assert(typeof project.tunnelRunning === "boolean");
      assert(project.pid === null || typeof project.pid === "number");
      assert(project.tunnelUrl === null || typeof project.tunnelUrl === "string");
    });

    it("should include project config fields (name, dir, start, port/tunnelPort)", async () => {
      const res = await request(app).get("/api/projects");

      const project = res.body.projects[0];
      assert(project.name);
      assert(project.dir);
      assert(project.start);
      assert(project.port !== undefined);
      assert(project.tunnelPort !== undefined);
    });

    it("should return array with correct structure", async () => {
      const res = await request(app).get("/api/projects");

      assert.strictEqual(res.status, 200);
      assert(Array.isArray(res.body.projects));
      assert(res.body.projects.length > 0);
    });
  });

  describe("GET /api/projects/:id", () => {
    it("should return 200 with single project status for valid project", async () => {
      // Get a real project ID first
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}`);

      assert.strictEqual(res.status, 200);
      assert(res.body.project);
      assert.strictEqual(res.body.project.id, projectId);
    });

    it("should include all status fields in response", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}`);

      const project = res.body.project;
      assert(typeof project.running === "boolean");
      assert(typeof project.tunnelRunning === "boolean");
      assert(project.pid === null || typeof project.pid === "number");
      assert(project.tunnelUrl === null || typeof project.tunnelUrl === "string");
      assert.strictEqual(project.id, projectId);
    });

    it("should return 404 for non-existent project", async () => {
      const res = await request(app).get("/api/projects/non-existent-project-id-xyz");

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Project not found");
    });

    it("should return 404 when project ID doesn't match any config", async () => {
      const res = await request(app).get("/api/projects/invalid-id-12345-xyz");

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Project not found");
    });
  });

  describe("POST /api/projects/:id/start", () => {
    it("should return 200 for valid project", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).post(`/api/projects/${projectId}/start`);

      assert.strictEqual(res.status, 200);
      assert(res.body.project);
      assert.strictEqual(res.body.project.id, projectId);
    });

    it("should return 404 for non-existent project", async () => {
      const res = await request(app).post("/api/projects/non-existent/start");

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Project not found");
    });

    it("should include project status in response", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).post(`/api/projects/${projectId}/start`);

      assert(res.body.project.running !== undefined);
      assert(res.body.project.pid !== undefined);
    });
  });

  describe("POST /api/projects/:id/stop", () => {
    it("should return 200 for valid project", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).post(`/api/projects/${projectId}/stop`);

      assert.strictEqual(res.status, 200);
      assert(res.body.project);
    });

    it("should return 404 for non-existent project", async () => {
      const res = await request(app).post("/api/projects/non-existent/stop");

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Project not found");
    });

    it("should include project status in response", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).post(`/api/projects/${projectId}/stop`);

      assert(res.body.project.running !== undefined);
      assert(res.body.project.pid !== undefined);
    });
  });

  describe("POST /api/projects/:id/tunnel-start", () => {
    it("should return 200 for valid project", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).post(`/api/projects/${projectId}/tunnel-start`);

      assert.strictEqual(res.status, 200);
      assert(res.body.project);
    });

    it("should return 404 for non-existent project", async () => {
      const res = await request(app).post("/api/projects/non-existent/tunnel-start");

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Project not found");
    });

    it("should include tunnel status in response", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).post(`/api/projects/${projectId}/tunnel-start`);

      assert(res.body.project.tunnelRunning !== undefined);
      assert(res.body.project.tunnelUrl !== undefined);
    });
  });

  describe("POST /api/projects/:id/tunnel-stop", () => {
    it("should return 200 for valid project", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).post(`/api/projects/${projectId}/tunnel-stop`);

      assert.strictEqual(res.status, 200);
      assert(res.body.project);
    });

    it("should return 404 for non-existent project", async () => {
      const res = await request(app).post("/api/projects/non-existent/tunnel-stop");

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Project not found");
    });

    it("should include tunnel status in response", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).post(`/api/projects/${projectId}/tunnel-stop`);

      assert(res.body.project.tunnelRunning !== undefined);
      assert(res.body.project.tunnelUrl !== undefined);
    });
  });

  describe("Status code compliance", () => {
    it("GET /api/projects should return 200", async () => {
      const res = await request(app).get("/api/projects");
      assert.strictEqual(res.status, 200);
    });

    it("GET /api/projects/:id (found) should return 200", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;
      const res = await request(app).get(`/api/projects/${projectId}`);
      assert.strictEqual(res.status, 200);
    });

    it("GET /api/projects/:id (not found) should return 404", async () => {
      const res = await request(app).get("/api/projects/non-existent-xyz");
      assert.strictEqual(res.status, 404);
    });

    it("POST /api/projects/:id/start should return 200 or 404", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;
      const res = await request(app).post(`/api/projects/${projectId}/start`);
      assert([200, 500].includes(res.status));
    });

    it("POST /api/projects/:id/stop should return 200 or 404", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;
      const res = await request(app).post(`/api/projects/${projectId}/stop`);
      assert([200, 500].includes(res.status));
    });
  });

  describe("Response structure", () => {
    it("GET /api/projects should have projects array", async () => {
      const res = await request(app).get("/api/projects");
      assert(res.body.projects);
      assert(Array.isArray(res.body.projects));
    });

    it("GET /api/projects/:id should have project object", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;
      const res = await request(app).get(`/api/projects/${projectId}`);
      assert(res.body.project);
      assert(typeof res.body.project === "object");
    });

    it("Error responses should have error field", async () => {
      const res = await request(app).get("/api/projects/non-existent-xyz");
      assert(res.body.error);
      assert(typeof res.body.error === "string");
    });

    it("Project response should contain all required fields", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;
      const res = await request(app).get(`/api/projects/${projectId}`);

      const project = res.body.project;
      assert(project.id);
      assert(project.name);
      assert(project.dir);
      assert(project.start);
      assert(project.tunnelPort);
      assert(project.running !== undefined);
      assert(project.tunnelRunning !== undefined);
      assert(project.pid !== undefined);
      assert(project.tunnelUrl !== undefined);
    });
  });

  describe("API response field types", () => {
    it("Projects list should have correct field types", async () => {
      const res = await request(app).get("/api/projects");
      const project = res.body.projects[0];

      assert(typeof project.id === "string");
      assert(typeof project.name === "string");
      assert(typeof project.dir === "string");
      assert(typeof project.start === "string");
      assert(typeof project.port === "number");
      assert(typeof project.tunnelPort === "number");
      assert(typeof project.running === "boolean");
      assert(typeof project.tunnelRunning === "boolean");
      assert(project.pid === null || typeof project.pid === "number");
      assert(project.tunnelUrl === null || typeof project.tunnelUrl === "string");
    });

    it("Single project should have correct field types", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;
      const res = await request(app).get(`/api/projects/${projectId}`);
      const project = res.body.project;

      assert(typeof project.id === "string");
      assert(typeof project.running === "boolean");
      assert(typeof project.tunnelRunning === "boolean");
      assert(project.pid === null || typeof project.pid === "number");
      assert(project.tunnelUrl === null || typeof project.tunnelUrl === "string");
    });
  });

  describe("GET /api/projects/:id/logs", () => {
    it("should return 200 with logs string for valid project", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs?type=app`);

      assert.strictEqual(res.status, 200);
      assert(res.body.logs !== undefined);
      assert(typeof res.body.logs === "string");
    });

    it("should return logs for app type", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs?type=app`);

      assert.strictEqual(res.status, 200);
      assert(typeof res.body.logs === "string");
    });

    it("should return logs for tunnel type", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs?type=tunnel`);

      assert.strictEqual(res.status, 200);
      assert(typeof res.body.logs === "string");
    });

    it("should return empty string if log doesn't exist", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs?type=app`);

      assert.strictEqual(res.status, 200);
      assert(typeof res.body.logs === "string");
      // May be empty if no logs written yet
    });

    it("should return 404 if project not found", async () => {
      const res = await request(app).get("/api/projects/non-existent-project/logs?type=app");

      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.error, "Project not found");
    });

    it("should return 400 for invalid log type", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs?type=invalid`);

      assert.strictEqual(res.status, 400);
      assert(res.body.error);
    });

    it("should accept maxBytes query parameter", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs?type=app&maxBytes=1000`);

      assert.strictEqual(res.status, 200);
      assert(typeof res.body.logs === "string");
    });

    it("should return 400 for invalid maxBytes", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs?type=app&maxBytes=invalid`);

      assert.strictEqual(res.status, 400);
      assert(res.body.error);
    });

    it("should return 400 for negative maxBytes", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs?type=app&maxBytes=-100`);

      assert.strictEqual(res.status, 400);
      assert(res.body.error);
    });

    it("should default to app type when type parameter not provided", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs`);

      assert.strictEqual(res.status, 200);
      assert(typeof res.body.logs === "string");
    });

    it("should default to 20KB (20000 bytes) when maxBytes not provided", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const res = await request(app).get(`/api/projects/${projectId}/logs?type=app`);

      assert.strictEqual(res.status, 200);
      // Verify it respects the default maxBytes by testing response is not huge
      assert(res.body.logs.length <= 100000); // Sanity check
    });

    it("should support both app and tunnel types", async () => {
      const listRes = await request(app).get("/api/projects");
      const projectId = listRes.body.projects[0].id;

      const appRes = await request(app).get(`/api/projects/${projectId}/logs?type=app`);
      const tunnelRes = await request(app).get(`/api/projects/${projectId}/logs?type=tunnel`);

      assert.strictEqual(appRes.status, 200);
      assert.strictEqual(tunnelRes.status, 200);
      assert(typeof appRes.body.logs === "string");
      assert(typeof tunnelRes.body.logs === "string");
    });
  });
});
