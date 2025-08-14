const app = require("./app");
const http = require("http");
const mongoose = require("mongoose");
const config = require("./utils/config");
const database = require("./database/index");

const PORT = config.port;

async () => {
  await database();
};

const server = http.createServer(app).listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  console.log("👋 SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    console.log("💥 Process terminated!");
  });
});
