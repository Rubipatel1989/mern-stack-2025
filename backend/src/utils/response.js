const sendSuccess = (
  res,
  { data = null, message = 'Success', statusCode = 200, meta }
) => {
  const payload = {
    status: true,
    message,
    data,
  };

  if (meta !== undefined) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

const sendError = (
  res,
  { message = 'Something went wrong', statusCode = 500, errors, details }
) => {
  const payload = {
    status: false,
    message,
  };

  if (errors !== undefined) {
    payload.errors = errors;
  }

  if (details !== undefined) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};

const sendNotFound = (res, { message = 'Resource not found', details }) =>
  sendError(res, { message, statusCode: 404, details });

module.exports = {
  sendSuccess,
  sendError,
  sendNotFound,
};

