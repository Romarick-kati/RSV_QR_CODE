import { ApiError } from '../utils/ApiError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `No route ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message, details: err.details });
  }

  // MongoDB duplicate-key error (e.g. duplicate email, or a race on the
  // unique [user, event] / [registration] indexes as a fallback to the
  // explicit application-level checks).
  if (err.code === 11000) {
    return res.status(409).json({ message: 'This record already exists.' });
  }

  // A malformed id in a route param (not a valid ObjectId) — same effect as
  // "not found" from the caller's point of view.
  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Resource not found.' });
  }

  // Mongoose schema validation failure.
  if (err.name === 'ValidationError') {
    const details = Object.fromEntries(
      Object.entries(err.errors || {}).map(([field, e]) => [field, e.message])
    );
    return res.status(400).json({ message: 'Validation failed.', details });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    message: 'Something went wrong on our end. Please try again.',
    ...(isDev && { debug: err.message }),
  });
}
