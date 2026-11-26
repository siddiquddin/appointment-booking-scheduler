export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || undefined;

  // Mongoose invalid ObjectId cast error
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid identifier format for field '${err.path}'`;
  }

  // Mongoose schema validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    message = errors[0] || 'Validation failed';
    details = errors;
  }

  // MongoDB duplicate key (e.g. unique client email)
  if (err.code === 11000) {
    statusCode = 409;
    const dupFields = Object.keys(err.keyPattern || {});
    message = dupFields.length
      ? `A record with this ${dupFields.join(', ')} already exists`
      : 'Duplicate record conflict';
  }

  if (statusCode >= 500) {
    console.error('[API Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {})
  });
}
