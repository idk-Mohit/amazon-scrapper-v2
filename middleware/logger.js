function requestLogger(req, res, next) {
  console.log(`${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
}

app.use(requestLogger); // Add this middleware to your Express app

module.exports = requestLogger;
