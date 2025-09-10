// const Voucher = require("../database/models/voucherModel");
// const File = require("../database/models/fileModel");
// const AppError = require("../utils/appError");
// const QRCode = require("qrcode");
// const sharp = require("sharp");
// const PDFDocument = require("pdfkit");
// const fs = require("fs");
// const path = require("path");

// exports.createVoucher = async (req) => {
//   const { _id } = req.user;
//   const { numberOfVouchers } = req.body;

//   if (!numberOfVouchers || numberOfVouchers <= 0) {
//     throw new AppError("Invalid voucher count", 400);
//   }

//   const vouchers = await Voucher.insertMany(
//     Array.from({ length: numberOfVouchers }, () => ({}))
//   );
//   const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//   const fileName = `vouchers_${timestamp}.pdf`;

//   const pdfPath = path.join(__dirname, `../public/${fileName}`);
//   const doc = new PDFDocument({ margin: 30 });
//   doc.pipe(fs.createWriteStream(pdfPath));

//   const qrSize = 150;
//   const gap = 20;
//   const perRow = 3;

//   let x = doc.page.margins.left;
//   let y = doc.page.margins.top;

//   for (let i = 0; i < vouchers.length; i++) {
//     const voucher = vouchers[i];

//     // const url = `${req.protocol}://${req.get("host")}/api/v1/voucher/redeem/${
//     //   voucher._id
//     // }`; 192.168.107.237

//     const url = `${req.protocol}://192.168.107.237:5678/api/v1/voucher/redeem/${voucher._id}`;

//     const qrBuffer = await QRCode.toBuffer(url, {
//       errorCorrectionLevel: "H",
//       width: 300,
//     });

//     const logoPath = path.join(__dirname, "../public/logo.jpg");
//     const logoSize = 60;

//     const qrWithLogo = await sharp(qrBuffer)
//       .composite([
//         {
//           input: await sharp(logoPath)
//             .resize(logoSize, logoSize)
//             .png()
//             .toBuffer(),
//           gravity: "center",
//         },
//       ])
//       .png()
//       .toBuffer();

//     doc.image(qrWithLogo, x, y, { width: qrSize, height: qrSize });

//     x += qrSize + gap;

//     if ((i + 1) % perRow === 0) {
//       x = doc.page.margins.left;
//       y += qrSize;
//     }

//     if (y + qrSize > doc.page.height - doc.page.margins.bottom) {
//       doc.addPage();
//       x = doc.page.margins.left;
//       y = doc.page.margins.top;
//     }
//   }

//   doc.end();
//   const file = await File.create({
//     fileName,
//     filePath: pdfPath,
//     userId: _id,
//   });

//   return { pdfPath, total: vouchers.length };
// };

// exports.redeemVoucher = async (req) => {
//   console.log("Redeeming voucher with ID:", req.params.id);
//   const voucherId = req.params.id;
//   const voucher = await Voucher.findById(voucherId);
//   if (!voucher) {
//     throw new AppError("Voucher not found", 404);
//   }
//   if (voucher.status === "redeemed" || voucher.status === "expired") {
//     throw new AppError("Voucher already redeemed or expired", 400);
//   }
//   voucher.status = "redeemed";
//   voucher.redeemedAt = new Date();
//   await voucher.save();
//   return;
// };

// const monthMap = {
//   january: 1,
//   february: 2,
//   march: 3,
//   april: 4,
//   may: 5,
//   june: 6,
//   july: 7,
//   august: 8,
//   september: 9,
//   october: 10,
//   november: 11,
//   december: 12,
// };

// const isValidDate = (d) => !isNaN(Date.parse(d));

// exports.getVoucherOverview = async (req, res, next) => {
//   let { month, startMonth, endMonth, year, startDate, endDate } = req.query;

//   let match = {};
//   let resolvedStart, resolvedEnd;

//   const now = new Date();

//   const convertMonth = (m) => {
//     if (!m) return null;
//     if (!isNaN(m)) return parseInt(m);
//     const monthNum = monthMap[m.toLowerCase()];
//     if (!monthNum) throw new AppError(`Invalid month: ${m}`, 400);
//     return monthNum;
//   };

//   month = convertMonth(month);
//   startMonth = convertMonth(startMonth);
//   endMonth = convertMonth(endMonth);

//   if (year && (!/^\d{4}$/.test(year) || year < 1970)) {
//     throw new AppError(`Invalid year: ${year}`, 400);
//   }

//   if (startDate && endDate) {
//     if (!isValidDate(startDate) || !isValidDate(endDate)) {
//       throw new AppError(
//         "Invalid startDate or endDate format. Use YYYY-MM-DD.",
//         400
//       );
//     }
//     resolvedStart = new Date(startDate);
//     resolvedEnd = new Date(endDate);
//   } else if (month && year) {
//     resolvedStart = new Date(year, month - 1, 1);
//     resolvedEnd = new Date(year, month, 0, 23, 59, 59);
//   } else if (startMonth && endMonth && year) {
//     if (startMonth > endMonth) {
//       throw new AppError("startMonth cannot be after endMonth", 400);
//     }
//     resolvedStart = new Date(year, startMonth - 1, 1);
//     resolvedEnd = new Date(year, endMonth, 0, 23, 59, 59);
//   } else {
//     resolvedStart = new Date(now);
//     resolvedStart.setDate(now.getDate() - now.getDay());
//     resolvedStart.setHours(0, 0, 0, 0);

//     resolvedEnd = new Date(resolvedStart);
//     resolvedEnd.setDate(resolvedStart.getDate() + 6);
//     resolvedEnd.setHours(23, 59, 59, 999);
//   }

//   match.redeemedAt = { $gte: resolvedStart, $lte: resolvedEnd };
//   match.status = "redeemed";

//   const overview = await Voucher.aggregate([
//     { $match: match },
//     {
//       $group: {
//         _id: null,
//         totalVouchers: { $sum: 1 },
//         totalVoucherCost: { $sum: "$voucherCost" },
//         totalVoucherValue: { $sum: "$voucherValue" },
//       },
//     },
//     {
//       $project: {
//         _id: 0,
//         totalVouchers: 1,
//         amountPaidByPeople: "$totalVoucherCost",
//         companyContribution: {
//           $multiply: [300, "$totalVouchers"],
//         },
//         totalVendorPayment: "$totalVoucherValue",
//       },
//     },
//   ]);

//   return overview;
// };

const Voucher = require("../database/models/voucherModel");
const File = require("../database/models/fileModel");
const AppError = require("../utils/appError");
const QRCode = require("qrcode");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");
const archiver = require("archiver");

// Function to generate unique 6-character alphaCode
const generateAlphaCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Function to ensure unique alphaCode
const generateUniqueAlphaCode = async () => {
  let alphaCode;
  let exists = true;

  while (exists) {
    alphaCode = generateAlphaCode();
    const existingVoucher = await Voucher.findOne({ alphaCode });
    exists = !!existingVoucher;
  }

  return alphaCode;
};

// Function to create voucher image with QR code and alpha code
const createVoucherImage = async (alphaCode, url, logoPath, outputPath) => {
  try {
    // Generate QR code buffer
    const qrBuffer = await QRCode.toBuffer(url, {
      errorCorrectionLevel: "H",
      width: 400,
      margin: 2,
    });

    // Create a canvas-like image with QR code, logo, and alpha code text
    const logoSize = 80;
    const imageWidth = 500;
    const imageHeight = 600;

    // Create base white background
    const baseImage = sharp({
      create: {
        width: imageWidth,
        height: imageHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    });

    // Prepare logo
    const logoBuffer = await sharp(logoPath)
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();

    // Create QR code with logo overlay
    const qrWithLogo = await sharp(qrBuffer)
      .composite([
        {
          input: logoBuffer,
          gravity: "center",
        },
      ])
      .png()
      .toBuffer();

    // Create text image for alpha code
    const textSvg = `
      <svg width="400" height="80" xmlns="http://www.w3.org/2000/svg">
        <style>
          .title { font: bold 32px Arial, sans-serif; }
        </style>
        <text x="50%" y="50%" text-anchor="middle" dy="0.35em" class="title" fill="black">
          Code: ${alphaCode}
        </text>
      </svg>
    `;

    const textBuffer = Buffer.from(textSvg);

    // Composite everything together
    const finalImage = await baseImage
      .composite([
        {
          input: qrWithLogo,
          top: 50,
          left: 50,
        },
        {
          input: textBuffer,
          top: 480,
          left: 50,
        },
      ])
      .png()
      .toBuffer();

    // Save the final image
    await fs.writeFile(outputPath, finalImage);

    return outputPath;
  } catch (error) {
    console.error("Error creating voucher image:", error);
    throw error;
  }
};

// Function to create zip file from folder
const createZipFromFolder = async (folderPath, zipPath) => {
  return new Promise((resolve, reject) => {
    const output = require("fs").createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    output.on("close", () => {
      console.log(`Zip file created: ${archive.pointer()} total bytes`);
      resolve(zipPath);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  });
};

exports.createVoucher = async (req) => {
  const { _id } = req.user;
  const { numberOfVouchers } = req.body;

  if (!numberOfVouchers || numberOfVouchers <= 0) {
    throw new AppError("Invalid voucher count", 400);
  }

  // Create vouchers with unique alpha codes
  const vouchersData = [];
  for (let i = 0; i < numberOfVouchers; i++) {
    const alphaCode = await generateUniqueAlphaCode();
    vouchersData.push({ alphaCode });
  }

  const vouchers = await Voucher.insertMany(vouchersData);

  // Create timestamp-based folder name
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const folderName = `vouchers_${timestamp}`;
  const folderPath = path.join(__dirname, `../public/${folderName}`);
  const zipFileName = `${folderName}.zip`;
  const zipPath = path.join(__dirname, `../public/${zipFileName}`);

  // Create the folder
  await fs.mkdir(folderPath, { recursive: true });

  const logoPath = path.join(__dirname, "../public/logo.jpg");

  // Generate images for each voucher
  for (let i = 0; i < vouchers.length; i++) {
    const voucher = vouchers[i];

    // Use alphaCode in URL instead of _id
    const url = `${req.protocol}://192.168.107.237:5678/api/v1/voucher/redeem/${voucher.alphaCode}`;

    const imageName = `voucher_${voucher.alphaCode}.png`;
    const imagePath = path.join(folderPath, imageName);

    await createVoucherImage(voucher.alphaCode, url, logoPath, imagePath);
  }

  // Create zip file from the folder
  await createZipFromFolder(folderPath, zipPath);

  // Save file record in database
  const file = await File.create({
    fileName: zipFileName,
    filePath: zipPath,
    userId: _id,
  });

  return {
    zipPath,
    folderPath,
    total: vouchers.length,
    downloadUrl: `/public/${zipFileName}`,
  };
};

exports.redeemVoucher = async (req) => {
  console.log("Redeeming voucher with alphaCode:", req.params.id);
  const alphaCode = req.params.id; // This is now alphaCode instead of _id

  const voucher = await Voucher.findOne({ alphaCode });

  if (!voucher) {
    throw new AppError("Voucher not found", 404);
  }

  if (voucher.status === "redeemed" || voucher.status === "expired") {
    throw new AppError("Voucher already redeemed or expired", 400);
  }

  voucher.status = "redeemed";
  voucher.redeemedAt = new Date();
  await voucher.save();

  return {
    message: "Voucher redeemed successfully",
    alphaCode: voucher.alphaCode,
    redeemedAt: voucher.redeemedAt,
  };
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
