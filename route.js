const authRouter = require("./controllers/authController");
const voucherRouter = require("./controllers/voucherController");
const fileRouter = require("./controllers/fileController");

const apiPrefix = "/api/v1";

const routes = [
  { route: authRouter, prefix: "/auth" },
  { route: voucherRouter, prefix: "/voucher" },
  { route: fileRouter, prefix: "/file" },
];

module.exports = (app) => {
  routes.forEach((element) => {
    app.use(`${apiPrefix}${element.prefix}`, element.route);
  });

  return app;
};
