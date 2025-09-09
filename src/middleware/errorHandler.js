export const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'SyntaxError' && err.status === 400) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  } else if (err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'External service unavailable';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service connection refused';
  } else if (err.code === 'ETIMEDOUT') {
    statusCode = 504;
    message = 'Request timeout';
  }

  // AI Provider specific errors
  if (err.message?.includes('anthropic') || err.message?.includes('claude')) {
    statusCode = 503;
    message = 'Claude AI service unavailable';
    details = process.env.NODE_ENV === 'development' ? err.message : null;
  } else if (err.message?.includes('openai') || err.message?.includes('gpt')) {
    statusCode = 503;
    message = 'OpenAI service unavailable';
    details = process.env.NODE_ENV === 'development' ? err.message : null;
  } else if (err.message?.includes('gemini') || err.message?.includes('google')) {
    statusCode = 503;
    message = 'Gemini AI service unavailable';
    details = process.env.NODE_ENV === 'development' ? err.message : null;
  }

  // Rate limiting errors
  if (err.message?.includes('rate limit') || err.message?.includes('quota')) {
    statusCode = 429;
    message = 'AI service rate limit exceeded';
    details = 'Please try again later';
  }

  const errorResponse = {
    error: true,
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err.message 
    })
  };

  res.status(statusCode).json(errorResponse);
};

// Create a standardized error class
export class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper to catch promise rejections
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};