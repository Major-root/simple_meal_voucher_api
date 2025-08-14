const { celebrate, Joi, Segments } = require("celebrate");

class AuthMiddleware {
  static registerValidation() {
    return celebrate({
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid("admin", "accountant", "user").required(),
      }),
    });
  }

  static loginValidation() {
    return celebrate({
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
      }),
    });
  }
}

module.exports = AuthMiddleware;
