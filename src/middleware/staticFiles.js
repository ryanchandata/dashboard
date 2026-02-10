import path from "path";
import fs from "fs";
import { config } from "../config/index.js";

/**
 * Static files middleware for serving frontend assets with proper headers.
 * 
 * Features:
 * - Serves files from public directory with proper MIME types
 * - Adds cache-control headers for efficient caching
 * - Implements SPA fallback: unknown routes return index.html
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function staticFilesMiddleware(req, res, next) {
  // Skip middleware for API routes
  if (req.path.startsWith("/api/")) {
    return next();
  }

  // Get the requested file path
  let filePath = path.join(config.dirs.public, req.path);

  // Prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(config.dirs.public)) {
    return next();
  }

  // Check if file exists
  if (fs.existsSync(filePath)) {
    // If it's a directory, try index.html
    if (fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    // Serve the file with appropriate headers
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".mjs": "application/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml; charset=utf-8",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
        ".eot": "application/vnd.ms-fontobject",
      };

      const mimeType = mimeTypes[ext] || "application/octet-stream";
      
      // Set cache-control headers
      // HTML files: no cache (for SPA updates)
      // CSS/JS/Images: long cache (1 year)
      let cacheControl = "public, max-age=31536000"; // 1 year
      if (ext === ".html") {
        cacheControl = "public, max-age=0, must-revalidate"; // No cache for HTML
      }

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Cache-Control", cacheControl);
      
      // Send the file
      return res.sendFile(filePath);
    }
  }

  // SPA fallback: return index.html for unknown routes
  const indexPath = path.join(config.dirs.public, "index.html");
  if (fs.existsSync(indexPath)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    return res.sendFile(indexPath);
  }

  // If no index.html found, continue to next middleware
  next();
}
