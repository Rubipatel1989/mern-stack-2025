const { verifyToken } = require('../utils/token');
const { sendError } = require('../utils/response');

const authenticate = (req, res, next) => {
  const authHeader = req.header('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, {
      message: 'Authorization header missing or malformed',
      statusCode: 401,
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);

    const roleName =
      typeof decoded.role === 'string'
        ? decoded.role
        : decoded.role?.name || decoded.role?.roleName;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    req.requesterRole = roleName ? String(roleName).toLowerCase().trim() : '';

    next();
  } catch (error) {
    return sendError(res, {
      message: 'Invalid or expired token',
      statusCode: 401,
    });
  }
};

module.exports = authenticate;

