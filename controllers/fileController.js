const router = require("express").Router();
const fileService = require("../services/fileService");
const catchAsync = require("../utils/catchAsync");
const guardMiddleware = require("../middlwares/guardMiddleware");

router.get(
  "/latest",
  guardMiddleware.protect,
  guardMiddleware.restrictTo("accountant"),
  catchAsync(async (req, res, next) => {
    const latestFile = await fileService.getUserLatestFile(req);
    console.log("Preparing to download file: ", latestFile.fileName);
    console.log("File path: ", latestFile.filePath);
    res.download(latestFile.filePath, latestFile.fileName, (err) => {
      if (err) {
        return next(err);
      }
    });
    console.log("File downloaded successfully: ", latestFile.fileName);
  })
);

module.exports = router;
