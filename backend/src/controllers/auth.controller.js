const mongoose = require('mongoose');

const User = require('../models/user.model');
const Role = require('../models/role.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { generateToken } = require('../utils/token');

const buildTokenPayload = (user) => ({
  sub: user.id,
  email: user.email,
  role: {
    id: user.role?._id || user.role?.id,
    name: user.role?.name,
  },
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, {
      message: 'Email and password are required',
      statusCode: 400,
    });
  }

  const user = await User.findOne({ email: email.toLowerCase() })
    .select('+password')
    .populate('role', 'name');

  if (!user) {
    return sendError(res, {
      message: 'Invalid credentials',
      statusCode: 401,
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, {
      message: 'Invalid credentials',
      statusCode: 401,
    });
  }

  const token = generateToken(buildTokenPayload(user));

  sendSuccess(res, {
    message: 'Login successful',
    data: {
      token,
      user,
    },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    message: 'Logout successful. Please discard the token on client side.',
    data: null,
  });
});

exports.registerSuperAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return sendError(res, {
      message: 'Name, email, and password are required',
      statusCode: 400,
    });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return sendError(res, {
      message: 'User already exists with this email',
      statusCode: 409,
    });
  }

  let role = await Role.findOne({ name: 'superadmin' });

  if (!role) {
    role = await Role.create({ name: 'superadmin', description: 'Super Admin' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role._id,
  });

  const populated = await user.populate('role', 'name');
  const token = generateToken(buildTokenPayload(populated));

  sendSuccess(res, {
    data: {
      token,
      user: populated,
    },
    message: 'Superadmin registered successfully',
    statusCode: 201,
  });
});

