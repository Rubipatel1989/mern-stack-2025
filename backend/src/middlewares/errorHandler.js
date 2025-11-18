const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  sendError(res, {
    message,
    statusCode,
    details: err.details,
  });
};

module.exports = errorHandler;

