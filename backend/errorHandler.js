function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(err, _req, res, _next) {
  const status = Number(err.status) || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    error: status >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Request failed"
  });
}

module.exports = { notFound, errorHandler };
