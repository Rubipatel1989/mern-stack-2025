const State = require('../models/state.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

/**
 * Get all states
 */
exports.getStates = asyncHandler(async (req, res) => {
  const { status, country, search } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (country) {
    query.country = { $regex: country, $options: 'i' };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  const states = await State.find(query)
    .sort({ name: 1 })
    .lean();

  sendSuccess(res, {
    data: states,
    message: 'States retrieved successfully',
  });
});

/**
 * Get state by ID
 */
exports.getStateById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const state = await State.findById(id).lean();

  if (!state) {
    return sendNotFound(res, { message: 'State not found' });
  }

  sendSuccess(res, {
    data: state,
    message: 'State retrieved successfully',
  });
});

/**
 * Create state
 */
exports.createState = asyncHandler(async (req, res) => {
  const { name, code, country = 'India', status = 'active' } = req.body;

  if (!name || !code) {
    return sendError(res, {
      message: 'Name and code are required',
      statusCode: 400,
    });
  }

  // Check if state with same name or code already exists
  const existingState = await State.findOne({
    $or: [{ name: { $regex: new RegExp(`^${name}$`, 'i') } }, { code: code.toUpperCase() }],
  });

  if (existingState) {
    return sendError(res, {
      message: 'State with this name or code already exists',
      statusCode: 400,
    });
  }

  const state = await State.create({
    name: name.trim(),
    code: code.toUpperCase().trim(),
    country: country.trim(),
    status,
  });

  sendSuccess(res, {
    data: state,
    message: 'State created successfully',
    statusCode: 201,
  });
});

/**
 * Update state
 */
exports.updateState = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, code, country, status } = req.body;

  const state = await State.findById(id);

  if (!state) {
    return sendNotFound(res, { message: 'State not found' });
  }

  // Check if updating name or code would create a duplicate
  if (name || code) {
    const duplicateQuery = {
      _id: { $ne: id },
      $or: [],
    };

    if (name) {
      duplicateQuery.$or.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    }
    if (code) {
      duplicateQuery.$or.push({ code: code.toUpperCase() });
    }

    if (duplicateQuery.$or.length > 0) {
      const existingState = await State.findOne(duplicateQuery);
      if (existingState) {
        return sendError(res, {
          message: 'State with this name or code already exists',
          statusCode: 400,
        });
      }
    }
  }

  if (name) state.name = name.trim();
  if (code) state.code = code.toUpperCase().trim();
  if (country) state.country = country.trim();
  if (status) state.status = status;

  await state.save();

  sendSuccess(res, {
    data: state,
    message: 'State updated successfully',
  });
});

/**
 * Delete state
 */
exports.deleteState = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const state = await State.findByIdAndDelete(id);

  if (!state) {
    return sendNotFound(res, { message: 'State not found' });
  }

  sendSuccess(res, {
    message: 'State deleted successfully',
  });
});

