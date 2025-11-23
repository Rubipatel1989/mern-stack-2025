const { sendError } = require('../utils/response');
const ErrorLog = require('../models/errorLog.model');

/**
 * Log error to database (non-blocking)
 */
const logErrorToDatabase = async (err, req) => {
  try {
    // Determine module from request path
    let module = 'unknown';
    if (req.path) {
      const pathParts = req.path.split('/').filter(Boolean);
      // Skip 'api' if present, get the actual module name
      const moduleIndex = pathParts[0] === 'api' ? 1 : 0;
      if (pathParts[moduleIndex]) {
        module = pathParts[moduleIndex];
      }
    }

    // Determine error level
    let level = 'error';
    const statusCode = err.statusCode || 500;
    if (statusCode >= 500) {
      level = 'critical';
    } else if (statusCode >= 400) {
      level = 'error';
    } else if (statusCode >= 300) {
      level = 'warning';
    }

    // Extract user from request if available
    const userId = req.user?.id || req.user?._id || null;

    // Prepare request data (sanitize sensitive info)
    const requestData = {
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      query: req.query,
      params: req.params,
    };

    // Don't log request body for security reasons (may contain passwords, tokens, etc.)
    // Only log body for non-sensitive endpoints
    const sensitivePaths = ['/auth/login', '/auth/register', '/auth/change-password'];
    if (!sensitivePaths.some(path => req.path.includes(path))) {
      requestData.body = req.body;
    }

    requestData.headers = {
      'user-agent': req.get('user-agent'),
      'content-type': req.get('content-type'),
    };

    await ErrorLog.create({
      module,
      level,
      message: err.message || 'Internal Server Error',
      stack: err.stack,
      statusCode,
      user: userId,
      request: requestData,
      ipAddress: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress,
      userAgent: req.get('user-agent'),
      metadata: {
        name: err.name,
        details: err.details,
        code: err.code,
      },
    });
  } catch (logError) {
    // If logging fails, just console.error (don't throw)
    console.error('Failed to log error to database:', logError);
  }
};

const errorHandler = async (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error to database (non-blocking)
  logErrorToDatabase(err, req).catch(() => {
    // Silently fail if logging fails
  });

  sendError(res, {
    message,
    statusCode,
    details: err.details,
  });
};

module.exports = errorHandler;

