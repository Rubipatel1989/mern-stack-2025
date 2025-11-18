const mongoose = require('mongoose');

const User = require('../models/user.model');
const Role = require('../models/role.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');
const { parseDob, calculateAge } = require('../utils/date');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, dob, address, role: requestedRole } =
    req.body;

  if (!name || !email) {
    return sendError(res, {
      message: 'Name and email are required',
      statusCode: 400,
    });
  }

  if (!password) {
    return sendError(res, {
      message: 'Password is required',
      statusCode: 400,
    });
  }

  if (!requestedRole) {
    return sendError(res, {
      message: 'Role is required',
      statusCode: 400,
    });
  }

  let roleDoc;

  if (mongoose.Types.ObjectId.isValid(requestedRole)) {
    roleDoc = await Role.findById(requestedRole);
  } else {
    roleDoc = await Role.findOne({
      name: String(requestedRole).toLowerCase().trim(),
    });
  }

  if (!roleDoc) {
    return sendError(res, {
      message: 'Role not found',
      statusCode: 400,
    });
  }

  const requesterRole = req.requesterRole;

  if (!['superadmin', 'admin'].includes(requesterRole)) {
    return sendError(res, {
      message: 'Only superadmin or admin can create users',
      statusCode: 403,
    });
  }

  let dateOfBirth;
  let age;

  if (dob) {
    try {
      dateOfBirth = parseDob(dob);
      age = calculateAge(dateOfBirth);
    } catch (error) {
      return sendError(res, {
        message: error.message,
        statusCode: 400,
      });
    }
  }

  const normalizedEmail = email.toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return sendError(res, {
      message: 'Email already in use',
      statusCode: 409,
    });
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    phone,
    password,
    dateOfBirth,
    age,
    address,
    role: roleDoc._id,
  });

  const populated = await user.populate('role', 'name');

  sendSuccess(res, {
    data: populated,
    message: 'User created successfully',
    statusCode: 201,
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .sort({ createdAt: -1 })
    .populate('role', 'name');

  if (!users.length) {
    return sendNotFound(res, { message: 'No users found' });
  }

  sendSuccess(res, {
    data: users,
    message: 'Records found',
  });
});

exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid user id', statusCode: 400 });
  }

  const user = await User.findById(id).populate('role', 'name');

  if (!user) {
    return sendNotFound(res, { message: 'User not found' });
  }

  sendSuccess(res, {
    data: user,
    message: 'Record found',
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { dob, password, role: requestedRole, ...restUpdates } = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid user id', statusCode: 400 });
  }

  const updates = { ...restUpdates };

  if (updates.email) {
    updates.email = updates.email.toLowerCase();
  }

  if (dob) {
    try {
      const dateOfBirth = parseDob(dob);
      updates.dateOfBirth = dateOfBirth;
      updates.age = calculateAge(dateOfBirth);
    } catch (error) {
      return sendError(res, {
        message: error.message,
        statusCode: 400,
      });
    }
  }

  if (password) {
    restUpdates.password = password;
  }

  if (requestedRole) {
    let roleDoc;

    if (mongoose.Types.ObjectId.isValid(requestedRole)) {
      roleDoc = await Role.findById(requestedRole);
    } else {
      roleDoc = await Role.findOne({
        name: String(requestedRole).toLowerCase().trim(),
      });
    }

    if (!roleDoc) {
      return sendError(res, {
        message: 'Role not found',
        statusCode: 400,
      });
    }

    updates.role = roleDoc._id;
  }

  let user = await User.findById(id).select('+password');

  if (!user) {
    return sendNotFound(res, { message: 'User not found' });
  }

  Object.assign(user, updates);

  if (password) {
    user.password = password;
  }

  await user.save();
  user = await user.populate('role', 'name');

  if (!user) {
    return sendNotFound(res, { message: 'User not found' });
  }

  sendSuccess(res, {
    data: user,
    message: 'User updated successfully',
  });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid user id', statusCode: 400 });
  }

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return sendNotFound(res, { message: 'User not found' });
  }

  sendSuccess(res, {
    data: null,
    message: 'User deleted successfully',
  });
});

