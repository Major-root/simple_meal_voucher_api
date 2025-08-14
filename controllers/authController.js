const router = require("express").Router();
const catchAsync = require("../utils/catchAsync");
const authService = require("../services/authService");
const AuthMiddleware = require("../middlwares/authMiddleware");
const guardMiddleware = require("../middlwares/guardMiddleware");

router.post(
  "/register",
  guardMiddleware.protect,
  guardMiddleware.restrictTo("admin"),
  AuthMiddleware.registerValidation(),
  catchAsync(async (req, res, next) => {
    await authService.register(req);
    res.status(201).json({
      status: "success",
      message: "User registered successfully",
    });
  })
);

router.post(
  "/login",
  AuthMiddleware.loginValidation(),
  catchAsync(async (req, res, next) => {
    const { user, token } = await authService.login(req);
    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      data: {
        user,
        token,
      },
    });
  })
);

module.exports = router;
