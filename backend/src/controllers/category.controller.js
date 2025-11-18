const Category = require('../models/category.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, parent, image, status } = req.body;

  if (!name) {
    return sendError(res, {
      message: 'Category name is required',
      statusCode: 400,
    });
  }

  const existing = await Category.findOne({ name: name.trim() });
  if (existing) {
    return sendError(res, {
      message: 'Category with this name already exists',
      statusCode: 409,
    });
  }

  if (parent) {
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      return sendError(res, {
        message: 'Parent category not found',
        statusCode: 400,
      });
    }
  }

  const category = await Category.create({
    name: name.trim(),
    description,
    parent: parent || null,
    image,
    status: status || 'active',
  });

  await category.populate('parent', 'name');

  sendSuccess(res, {
    data: category,
    message: 'Category created successfully',
    statusCode: 201,
  });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const { status, parent } = req.query;
  const query = {};

  if (status) {
    query.status = status;
  }

  if (parent === 'null' || parent === '') {
    query.parent = null;
  } else if (parent) {
    query.parent = parent;
  }

  const categories = await Category.find(query)
    .populate('parent', 'name')
    .sort({ name: 1 });

  if (!categories.length) {
    return sendNotFound(res, { message: 'No categories found' });
  }

  sendSuccess(res, {
    data: categories,
    message: 'Categories retrieved successfully',
  });
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id).populate('parent', 'name');

  if (!category) {
    return sendNotFound(res, { message: 'Category not found' });
  }

  sendSuccess(res, {
    data: category,
    message: 'Category retrieved successfully',
  });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { parent, ...updates } = req.body;

  if (updates.name) {
    updates.name = updates.name.trim();
    const existing = await Category.findOne({ name: updates.name, _id: { $ne: id } });
    if (existing) {
      return sendError(res, {
        message: 'Category with this name already exists',
        statusCode: 409,
      });
    }
  }

  if (parent !== undefined) {
    if (parent === null || parent === '') {
      updates.parent = null;
    } else {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return sendError(res, {
          message: 'Parent category not found',
          statusCode: 400,
        });
      }
      // Prevent circular reference
      if (parent === id) {
        return sendError(res, {
          message: 'Category cannot be its own parent',
          statusCode: 400,
        });
      }
      updates.parent = parent;
    }
  }

  const category = await Category.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate('parent', 'name');

  if (!category) {
    return sendNotFound(res, { message: 'Category not found' });
  }

  sendSuccess(res, {
    data: category,
    message: 'Category updated successfully',
  });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    return sendNotFound(res, { message: 'Category not found' });
  }

  // Check if category has children
  const childrenCount = await Category.countDocuments({ parent: id });
  if (childrenCount > 0) {
    return sendError(res, {
      message: `Cannot delete category. It has ${childrenCount} sub-category(ies)`,
      statusCode: 400,
    });
  }

  // Check if category is used in products
  const Product = require('../models/product.model');
  const productCount = await Product.countDocuments({ category: id });

  if (productCount > 0) {
    return sendError(res, {
      message: `Cannot delete category. It is used in ${productCount} product(s)`,
      statusCode: 400,
    });
  }

  await Category.findByIdAndDelete(id);

  sendSuccess(res, {
    data: null,
    message: 'Category deleted successfully',
  });
});

