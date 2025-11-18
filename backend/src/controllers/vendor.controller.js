const Vendor = require('../models/vendor.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

exports.createVendor = asyncHandler(async (req, res) => {
  const { name, description, contactEmail, contactPhone, address, status } = req.body;

  if (!name) {
    return sendError(res, {
      message: 'Vendor name is required',
      statusCode: 400,
    });
  }

  const existing = await Vendor.findOne({ name: name.trim() });
  if (existing) {
    return sendError(res, {
      message: 'Vendor with this name already exists',
      statusCode: 409,
    });
  }

  const vendor = await Vendor.create({
    name: name.trim(),
    description,
    contactEmail,
    contactPhone,
    address,
    status: status || 'active',
  });

  sendSuccess(res, {
    data: vendor,
    message: 'Vendor created successfully',
    statusCode: 201,
  });
});

exports.getVendors = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = {};

  if (status) {
    query.status = status;
  }

  const vendors = await Vendor.find(query).sort({ name: 1 });

  if (!vendors.length) {
    return sendNotFound(res, { message: 'No vendors found' });
  }

  sendSuccess(res, {
    data: vendors,
    message: 'Vendors retrieved successfully',
  });
});

exports.getVendorById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendor = await Vendor.findById(id);

  if (!vendor) {
    return sendNotFound(res, { message: 'Vendor not found' });
  }

  sendSuccess(res, {
    data: vendor,
    message: 'Vendor retrieved successfully',
  });
});

exports.updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.name) {
    updates.name = updates.name.trim();
    const existing = await Vendor.findOne({ name: updates.name, _id: { $ne: id } });
    if (existing) {
      return sendError(res, {
        message: 'Vendor with this name already exists',
        statusCode: 409,
      });
    }
  }

  const vendor = await Vendor.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!vendor) {
    return sendNotFound(res, { message: 'Vendor not found' });
  }

  sendSuccess(res, {
    data: vendor,
    message: 'Vendor updated successfully',
  });
});

exports.deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    return sendNotFound(res, { message: 'Vendor not found' });
  }

  // Check if vendor is used in products
  const Product = require('../models/product.model');
  const productCount = await Product.countDocuments({ vendor: id });

  if (productCount > 0) {
    return sendError(res, {
      message: `Cannot delete vendor. It is used in ${productCount} product(s)`,
      statusCode: 400,
    });
  }

  await Vendor.findByIdAndDelete(id);

  sendSuccess(res, {
    data: null,
    message: 'Vendor deleted successfully',
  });
});

