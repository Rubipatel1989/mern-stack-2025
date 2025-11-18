const Role = require('../models/role.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { ROLE_NAMES } = require('../constants/roles');

exports.createRole = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return sendError(res, {
      message: 'Role name is required',
      statusCode: 400,
    });
  }

  const normalized = String(name).toLowerCase().trim();

  if (!ROLE_NAMES.includes(normalized)) {
    return sendError(res, {
      message: `Role must be one of: ${ROLE_NAMES.join(', ')}`,
      statusCode: 400,
    });
  }

  const existing = await Role.findOne({ name: normalized });
  if (existing) {
    return sendError(res, {
      message: 'Role already exists',
      statusCode: 409,
    });
  }

  const role = await Role.create({ name: normalized, description });

  sendSuccess(res, {
    data: role,
    message: 'Role created successfully',
    statusCode: 201,
  });
});

exports.getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ createdAt: -1 });

  if (!roles.length) {
    return sendError(res, {
      message: 'No roles found',
      statusCode: 404,
    });
  }

  sendSuccess(res, {
    data: roles,
    message: 'Roles retrieved successfully',
  });
});

