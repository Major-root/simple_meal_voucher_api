const { Joi, celebrate, Segments } = require("celebrate");

class VoucherMiddleware {
  static validateCreateVoucher() {
    return celebrate({
      [Segments.BODY]: Joi.object().keys({
        numberOfVouchers: Joi.number().integer().min(1).required(),
      }),
    });
  }
}

module.exports = VoucherMiddleware;
