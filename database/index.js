const mongoose = require("mongoose");
const config = require("../utils/config");

const DATABASE_URL = config.databaseUrl;

module.exports = mongoose
  .connect(DATABASE_URL, {})
  .then(() => {
    console.log("Connected to MongoDB successfully");
  })
  .catch((error) => {
    throw new Error("Failed to connect to MongoDB: " + error.message);
  });
