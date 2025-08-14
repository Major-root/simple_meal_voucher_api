const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

module.exports = {
  port: process.env.PORT || 56789,
  databaseUrl: process.env.DATABASE_URL,
  node_env: process.env.NODE_EVN,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRATION,
};
