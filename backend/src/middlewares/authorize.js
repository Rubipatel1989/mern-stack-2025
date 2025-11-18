const { sendError } = require('../utils/response');

const normalizeRole = (role) => (role ? String(role).toLowerCase().trim() : '');

const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  return (req, res, next) => {
    const roleName = normalizeRole(req.requesterRole);

    if (!roleName) {
      return sendError(res, {
        message: 'Authentication required',
        statusCode: 401,
      });
    }

    if (normalizedAllowed.length && !normalizedAllowed.includes(roleName)) {
      return sendError(res, {
        message: 'You do not have permission to perform this action',
        statusCode: 403,
      });
    }

    next();
  };
};

module.exports = {
  authorizeRoles,
};

