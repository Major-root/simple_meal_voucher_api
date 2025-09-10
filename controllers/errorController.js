const AppError = require("../utils/appError");
const config = require("../utils/config");

const handleValidationError = (err) => {
  const message = err.errors[0].message;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errorResponse.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const handleCelebrateError = (err) => {
  const message = err.details.get("body").details[0].message;
  return new AppError(message, 400);
};
const sendDevErr = (err, res) => {
  console.log("error is ", err);
  return res.status(err.statusCode).json({
    status: false,
    message: err.message,
    err: err,
  });
};
const sendErrorProd = (err, req, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  return res.status(500).json({
    status: "error",
    message: "Something went very wrong!",
  });
};

module.exports = (err, req, res, next) => {
  console.log("Error occurred:", err);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (config.node_env === "development") {
    sendDevErr(err, res);
  } else if (config.node_env === "production") {
    let error = { ...err };
    error.message = err.message;
    if (error.name === "ValidationError") {
      error = handleValidationError(error);
    }

    if (error.details instanceof Map) {
      error = handleCelebrateError(error);
    }
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    sendErrorProd(error, req, res);
  }
};
