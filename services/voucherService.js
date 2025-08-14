const Voucher = require("../database/models/voucherModel");
const File = require("../database/models/fileModel");
const AppError = require("../utils/appError");
const QRCode = require("qrcode");
const sharp = require("sharp");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.createVoucher = async (req) => {
  const { _id } = req.user;
  const { numberOfVouchers } = req.body;

  if (!numberOfVouchers || numberOfVouchers <= 0) {
    throw new AppError("Invalid voucher count", 400);
  }

  const vouchers = await Voucher.insertMany(
    Array.from({ length: numberOfVouchers }, () => ({}))
  );
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `vouchers_${timestamp}.pdf`;

  const pdfPath = path.join(__dirname, `../public/${fileName}`);
  const doc = new PDFDocument({ margin: 30 });
  doc.pipe(fs.createWriteStream(pdfPath));

  const qrSize = 150;
  const gap = 20;
  const perRow = 3;

  let x = doc.page.margins.left;
  let y = doc.page.margins.top;

  for (let i = 0; i < vouchers.length; i++) {
    const voucher = vouchers[i];

    // const url = `${req.protocol}://${req.get("host")}/api/v1/voucher/redeem/${
    //   voucher._id
    // }`; 192.168.107.237

    const url = `${req.protocol}://192.168.107.237:5678/api/v1/voucher/redeem/${voucher._id}`;

    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: "H",
      width: 300,
    });

    const logoPath = path.join(__dirname, "../public/logo.jpg");
    const logoSize = 60;

    const qrWithLogo = await sharp(qrBuffer)
      .composite([
        {
          input: await sharp(logoPath)
            .resize(logoSize, logoSize)
            .png()
            .toBuffer(),
          gravity: "center",
        },
      ])
      .png()
      .toBuffer();

    doc.image(qrWithLogo, x, y, { width: qrSize, height: qrSize });

    x += qrSize + gap;

    if ((i + 1) % perRow === 0) {
      x = doc.page.margins.left;
      y += qrSize;
    }

    if (y + qrSize > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      x = doc.page.margins.left;
      y = doc.page.margins.top;
    }
  }

  doc.end();
  const file = await File.create({
    fileName,
    filePath: pdfPath,
    userId: _id,
  });

  return { pdfPath, total: vouchers.length };
};

exports.redeemVoucher = async (req) => {
  console.log("Redeeming voucher with ID:", req.params.id);
  const voucherId = req.params.id;
  const voucher = await Voucher.findById(voucherId);
  if (!voucher) {
    throw new AppError("Voucher not found", 404);
  }
  if (voucher.status === "redeemed" || voucher.status === "expired") {
    throw new AppError("Voucher already redeemed or expired", 400);
  }
  voucher.status = "redeemed";
  voucher.redeemedAt = new Date();
  await voucher.save();
  return;
};

const monthMap = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const isValidDate = (d) => !isNaN(Date.parse(d));

exports.getVoucherOverview = async (req, res, next) => {
  let { month, startMonth, endMonth, year, startDate, endDate } = req.query;

  let match = {};
  let resolvedStart, resolvedEnd;

  const now = new Date();

  const convertMonth = (m) => {
    if (!m) return null;
    if (!isNaN(m)) return parseInt(m);
    const monthNum = monthMap[m.toLowerCase()];
    if (!monthNum) throw new AppError(`Invalid month: ${m}`, 400);
    return monthNum;
  };

  month = convertMonth(month);
  startMonth = convertMonth(startMonth);
  endMonth = convertMonth(endMonth);

  if (year && (!/^\d{4}$/.test(year) || year < 1970)) {
    throw new AppError(`Invalid year: ${year}`, 400);
  }

  if (startDate && endDate) {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      throw new AppError(
        "Invalid startDate or endDate format. Use YYYY-MM-DD.",
        400
      );
    }
    resolvedStart = new Date(startDate);
    resolvedEnd = new Date(endDate);
  } else if (month && year) {
    resolvedStart = new Date(year, month - 1, 1);
    resolvedEnd = new Date(year, month, 0, 23, 59, 59);
  } else if (startMonth && endMonth && year) {
    if (startMonth > endMonth) {
      throw new AppError("startMonth cannot be after endMonth", 400);
    }
    resolvedStart = new Date(year, startMonth - 1, 1);
    resolvedEnd = new Date(year, endMonth, 0, 23, 59, 59);
  } else {
    resolvedStart = new Date(now);
    resolvedStart.setDate(now.getDate() - now.getDay());
    resolvedStart.setHours(0, 0, 0, 0);

    resolvedEnd = new Date(resolvedStart);
    resolvedEnd.setDate(resolvedStart.getDate() + 6);
    resolvedEnd.setHours(23, 59, 59, 999);
  }

  match.redeemedAt = { $gte: resolvedStart, $lte: resolvedEnd };
  match.status = "redeemed";

  const overview = await Voucher.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalVouchers: { $sum: 1 },
        totalVoucherCost: { $sum: "$voucherCost" },
        totalVoucherValue: { $sum: "$voucherValue" },
      },
    },
    {
      $project: {
        _id: 0,
        totalVouchers: 1,
        amountPaidByPeople: "$totalVoucherCost",
        companyContribution: {
          $multiply: [300, "$totalVouchers"],
        },
        totalVendorPayment: "$totalVoucherValue",
      },
    },
  ]);

  return overview;
};
