const express = require("express");
const search = require("./modules/search");
const product = require("./modules/product");
const header = require("./modules/header");
const winston = require("winston");
const fs = require("fs");

const app = express();

// Middlewares for logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.File({ filename: "logs.log" })],
});

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});
// // Configure Winston logger to log to a file
// const logger = winston.createLogger({
//   transports: [new winston.transports.File({ filename: "logs.log" })],
// });

// // Logger Middleware
// app.use((req, res, next) => {
//   const logMessage = `${new Date().toISOString()} - ${req.method} ${req.url}`;
//   logger.info(logMessage);
//   next();
// });

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).send("Something broke!");
});

// Main Code
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/search/:query", async (req, res) => {
  try {
    const result = await search(req.params.query, req.headers.host);
    const headers = header(req.headers);

    res.status(200).set(headers).send(result);
  } catch (error) {
    next(error); // Forward the error to the error handling middleware
  }
});

app.get("/product/:query*", async (req, res) => {
  try {
    const pathname = new URL(req.originalUrl, `http://${req.headers.host}`)
      .pathname;
    const query = pathname.slice("/product/".length);
    const result = await product(query);
    const headers = header(req.headers);

    res.status(200).set(headers).send(result);
  } catch (error) {
    next(error); // Forward the error to the error handling middleware
  }
});

app.get("/", (req, res) => {
  const headers = header(req.headers);
  res.status(200).set(headers).json({
    alive: true,
    description: "Amazon India Scraper with search and product API.",
    // made_by: "https://github.com/idk-Mohit",
  });
});

app.options("*", (req, res) => {
  const headers = header(req.headers);
  res.status(200).set(headers).send("🤝");
});

const PORT = process.env.PORT || 80;

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
