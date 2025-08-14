const router = require("express").Router();
const voucherService = require("../services/voucherService");
const catchAsync = require("../utils/catchAsync");
const VoucherMiddleware = require("../middlwares/voucherMiddleware");
const guardMiddleware = require("../middlwares/guardMiddleware");

router.post(
  "/create",
  guardMiddleware.protect,
  VoucherMiddleware.validateCreateVoucher(),
  guardMiddleware.restrictTo("accountant"),
  catchAsync(async (req, res, next) => {
    const { pdfPath, total } = await voucherService.createVoucher(req);
    res.status(201).json({
      status: "success",
      data: {
        pdfPath,
        total,
      },
    });
  })
);

router.get(
  "/overview",
  guardMiddleware.protect,
  guardMiddleware.restrictTo("accountant"),
  catchAsync(async (req, res, next) => {
    const reports = await voucherService.getVoucherOverview(req);
    res.status(200).json({
      status: "success",
      data: reports,
    });
  })
);

router.get(
  "/redeem/:id",
  guardMiddleware.protect,
  guardMiddleware.restrictTo("user"),
  catchAsync(async (req, res, next) => {
    const voucher = await voucherService.redeemVoucher(req);
    res.status(200).json({
      status: "success",
      message: "Voucher redeemed successfully",
    });
  })
);

module.exports = router;
