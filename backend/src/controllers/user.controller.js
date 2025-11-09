const mongoose = require('mongoose');

const User = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, age } = req.body;

  if (!name || !email) {
    return sendError(res, {
      message: 'Name and email are required',
      statusCode: 400,
    });
  }

  const user = await User.create({ name, email, phone, age });

  sendSuccess(res, {
    data: user,
    message: 'User created successfully',
    statusCode: 201,
  });
});

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

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

  const user = await User.findById(id);

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
  const updates = req.body;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid user id', statusCode: 400 });
  }

  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

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

