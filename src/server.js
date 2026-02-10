import app from "./app.js";
import { config } from "./config/index.js";

const server = app.listen(config.port, () => {
  console.log(
    `Dashboard server running on http://127.0.0.1:${config.port} (${config.env})`
  );
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

export default server;
