const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    voucherCost: {
      type: Number,
      required: true,
      default: 400,
    },
    voucherValue: {
      type: Number,
      required: true,
      default: 700,
    },
    redeemedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "redeemed", "expired"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

const Voucher = mongoose.model("Voucher", voucherSchema);

module.exports = Voucher;
