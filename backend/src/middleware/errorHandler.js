function errorHandler(err, req, res, next) {
  console.error('Unhandled Application Error:', err);

  // Zod validation error formatting
  if (err.name === 'ZodError' || err.errors) {
    const issues = (err.errors || []).map(e => {
      const field = e.path.join('.') || 'field';
      return `${field}: ${e.message}`;
    }).join('; ');

    return res.status(400).json({
      success: false,
      error: `Validation Error: ${issues || 'Invalid request payload'}`,
      details: err.errors,
    });
  }

  // PostgreSQL unique violation error code
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Conflict: A record with this unique identifier already exists',
      detail: err.detail,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference: Specified related entity does not exist',
      detail: err.detail,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
