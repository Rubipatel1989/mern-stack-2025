const mongoose = require('mongoose');

const User = require('../models/user.model');
const Role = require('../models/role.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const { generateToken } = require('../utils/token');
const { logCustomActivity } = require('../middlewares/activityLogger');

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

  // Log login activity (only for customers)
  const userRole = user.role?.name || user.role || '';
  const isCustomer = userRole.toLowerCase() === 'customer';
  
  if (isCustomer && user._id) {
    logCustomActivity(user._id, 'login', {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      description: 'User logged in',
    });
  }

  sendSuccess(res, {
    message: 'Login successful',
    data: {
      token,
      user,
    },
  });
});

exports.logout = asyncHandler(async (req, res) => {
  // Log logout activity (only for customers)
  if (req.user && req.user._id) {
    const userRole = req.user.role?.name || req.user.role || '';
    const isCustomer = userRole.toLowerCase() === 'customer';
    
    if (isCustomer) {
      logCustomActivity(req.user._id, 'logout', {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        description: 'User logged out',
      });
    }
  }

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

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, dob, address } = req.body;

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

  let role = await Role.findOne({ name: 'customer' });

  if (!role) {
    role = await Role.create({ name: 'customer', description: 'Customer' });
  }

  const userData = {
    name,
    email,
    password,
    phone,
    role: role._id,
  };

  if (dob) {
    const { parseDob, calculateAge } = require('../utils/date');
    try {
      userData.dateOfBirth = parseDob(dob);
      userData.age = calculateAge(userData.dateOfBirth);
    } catch (error) {
      return sendError(res, {
        message: error.message,
        statusCode: 400,
      });
    }
  }

  if (address) {
    userData.address = address;
  }

  const user = await User.create(userData);

  const populated = await user.populate('role', 'name');
  const token = generateToken(buildTokenPayload(populated));

  sendSuccess(res, {
    data: {
      token,
      user: populated,
    },
    message: 'Registration successful',
    statusCode: 201,
  });
});

