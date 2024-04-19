function errorHandler(err, req, res, next) {
  console.error(err.stack); // Log the error stack trace
  res.status(500).send("Something went wrong!");
}

app.use(errorHandler); // Add this as the last middleware in your app

module.exports = errorHandler;
