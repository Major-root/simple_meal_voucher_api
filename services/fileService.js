const File = require("../database/models/fileModel");
const AppError = require("../utils/appError");

exports.getUserLatestFile = async (req) => {
  console.log("Fetching latest file for user:", req.user);
  const userId = req.user._id;
  const latestFile = await File.findOne({ userId }).sort({ createdAt: -1 });
  console.log("Latest file found:", latestFile);
  if (!latestFile) {
    throw new AppError("No file found for this user", 404);
  }
  latestFile.downloaded = true;
  await latestFile.save();
  return latestFile;
};
