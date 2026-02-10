import { Router } from "express";
import { config } from "../config/index.js";

const router = Router();

// GET /api/config - Get basic server configuration
router.get("/", (req, res) => {
  res.json({
    port: config.port,
    env: config.env,
  });
});

export default router;
