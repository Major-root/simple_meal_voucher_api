const User = require("../database/models/userModel");
const encrypt = require("../utils/encrypt");
const jwt = require("../utils/jwt");
const AppError = require("../utils/appError");

exports.register = async (req) => {
  const { email, password, role } = req.body;
  const hashedPassword = await encrypt.hashPassword(password);

  await User.create({
    email,
    password: hashedPassword,
    role,
  });
  return;
};

exports.login = async (req) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("User not found", 401);
  }

  const isPasswordValid = await encrypt.comparePassword(
    password,
    user.password
  );
  if (!isPasswordValid) {
    throw new AppError("Invalid  email or password", 401);
  }

  const token = jwt.generateToken(user.userId);
  return { user, token };
};
