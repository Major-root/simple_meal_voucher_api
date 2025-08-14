const jwt = require("jsonwebtoken");
const config = require("./config");

exports.generateToken = (userId) => {
  try {
    const token = jwt.sign({ id: userId }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
    return token;
  } catch (error) {
    throw new Error("Error generating token: " + error.message);
  }
};
