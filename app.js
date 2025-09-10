const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const appRouter = require("./route");
const errorController = require("./controllers/errorController");
const AppError = require("./utils/appError");
const path = require("path");

const app = express();

app.use(cors());
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

// Ignore common browser requests that cause unnecessary errors
app.use((req, res, next) => {
  const ignoredPaths = [
    "/favicon.ico",
    "/.well-known/appspecific/com.chrome.devtools.json",
    "/apple-touch-icon.png",
    "/robots.txt",
  ];

  if (ignoredPaths.some((path) => req.path.startsWith(path))) {
    return res.status(204).end(); // No content, silently ignore
  }
  next();
});

app.use("/", express.static(path.join(__dirname, "template")));

appRouter(app);

app.use((req, res, next) => {
  next(new AppError(`${req.originalUrl} is not found in my server`, 400));
});

app.use(errorController);

module.exports = app;
