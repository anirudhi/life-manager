export const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle OpenAI API errors
  if (err.code && err.code.includes('openai')) {
    return res.status(502).json({
      success: false,
      error: 'LLM service error',
      details: 'Failed to process transcription with AI service'
    });
  }

  // Handle PocketBase errors
  if (err.status && err.data) {
    return res.status(err.status || 500).json({
      success: false,
      error: 'Database error',
      details: err.data.message || 'Database operation failed'
    });
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}; 