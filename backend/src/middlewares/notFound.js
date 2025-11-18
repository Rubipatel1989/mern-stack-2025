const { sendNotFound } = require('../utils/response');

const notFound = (req, res, next) => {
  sendNotFound(res, { message: `Route ${req.originalUrl} not found` });
};

module.exports = notFound;

