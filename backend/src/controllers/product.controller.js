const mongoose = require('mongoose');

const Product = require('../models/product.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    compareAtPrice,
    sku,
    category,
    tags,
    images: imagesFromBody,
    stock,
    status,
    featured,
    weight,
    dimensions,
    vendor,
    seo,
  } = req.body;

  if (!name || !price) {
    return sendError(res, {
      message: 'Name and price are required',
      statusCode: 400,
    });
  }

  if (price < 0) {
    return sendError(res, {
      message: 'Price cannot be negative',
      statusCode: 400,
    });
  }

  // Handle uploaded files - map to URLs
  let imageUrls = [];
  if (req.files && req.files.length > 0) {
    imageUrls = req.files.map((file) => `/uploads/products/${file.filename}`);
  } else if (imagesFromBody) {
    // Support both file uploads and URL strings
    imageUrls = Array.isArray(imagesFromBody) ? imagesFromBody : [imagesFromBody];
  }

  // Parse tags if it's a string
  let parsedTags = [];
  if (tags) {
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map((tag) => tag.trim()).filter((tag) => tag);
    } else if (Array.isArray(tags)) {
      parsedTags = tags;
    }
  }

  // Parse dimensions if provided
  let parsedDimensions = undefined;
  if (dimensions) {
    if (typeof dimensions === 'string') {
      try {
        parsedDimensions = JSON.parse(dimensions);
      } catch (e) {
        // If parsing fails, try to construct from separate fields
        parsedDimensions = dimensions;
      }
    } else {
      parsedDimensions = dimensions;
    }
  }

  // Parse specifications if provided
  let parsedSpecifications = {};
  if (req.body.specifications) {
    if (typeof req.body.specifications === 'string') {
      try {
        parsedSpecifications = JSON.parse(req.body.specifications);
      } catch (e) {
        parsedSpecifications = {};
      }
    } else {
      parsedSpecifications = req.body.specifications;
    }
  }

  const productData = {
    name,
    description,
    price: Number(price),
    compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
    sku,
    category: category || undefined,
    tags: parsedTags,
    images: imageUrls,
    stock: stock !== undefined ? Number(stock) : 0,
    status: status || 'active',
    featured: featured === true || featured === 'true',
    weight: weight ? Number(weight) : undefined,
    weightUnit: req.body.weightUnit || 'kg',
    dimensions: parsedDimensions,
    dimensionUnit: req.body.dimensionUnit || 'cm',
    vendor: vendor || undefined,
    brand: req.body.brand || undefined,
    color: req.body.color || undefined,
    size: req.body.size || undefined,
    material: req.body.material || undefined,
    specifications: parsedSpecifications,
    warranty: req.body.warranty || undefined,
    shippingInfo: req.body.shippingInfo || undefined,
    returnPolicy: req.body.returnPolicy || undefined,
    seo: seo ? (typeof seo === 'string' ? JSON.parse(seo) : seo) : undefined,
  };

  const product = await Product.create(productData);
  await product.populate('category', 'name');
  await product.populate('vendor', 'name');

  sendSuccess(res, {
    data: product,
    message: 'Product created successfully',
    statusCode: 201,
  });
});

exports.getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    status,
    featured,
    search,
    minPrice,
    maxPrice,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = req.query;

  const query = {};

  // Handle category filter - search by category name or ID
  if (category) {
    const Category = require('../models/category.model');
    if (mongoose.Types.ObjectId.isValid(category)) {
      // If it's a valid ObjectId, use it directly
      query.category = category;
    } else {
      // Search for categories by name (case-insensitive partial match)
      const matchingCategories = await Category.find({
        name: { $regex: category, $options: 'i' }
      }).select('_id').lean();
      
      if (matchingCategories.length > 0) {
        // Use the found category IDs
        query.category = { $in: matchingCategories.map(cat => cat._id) };
      } else {
        // No matching categories found, return empty result
        query.category = { $in: [] };
      }
    }
  }

  if (status) {
    query.status = status;
  }

  if (featured !== undefined) {
    query.featured = featured === 'true';
  }

  // Handle search - use regex on name and description instead of $text
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      query.price.$lte = Number(maxPrice);
    }
  }

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const skip = (Number(page) - 1) * Number(limit);

  // Fetch products without populate first to avoid ObjectId casting errors
  let products = await Product.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(Number(limit))
    .lean();
  
  // Manually populate only valid ObjectIds (in parallel for better performance)
  const Category = require('../models/category.model');
  const Vendor = require('../models/vendor.model');
  
  // Collect unique category and vendor IDs
  const categoryIds = new Set();
  const vendorIds = new Set();
  
  products.forEach((product) => {
    if (product.category && mongoose.Types.ObjectId.isValid(product.category)) {
      categoryIds.add(product.category.toString());
    }
    if (product.vendor && mongoose.Types.ObjectId.isValid(product.vendor)) {
      vendorIds.add(product.vendor.toString());
    }
  });
  
  // Fetch all categories and vendors in parallel
  const [categories, vendors] = await Promise.all([
    categoryIds.size > 0
      ? Category.find({ _id: { $in: Array.from(categoryIds) } }).select('name').lean()
      : [],
    vendorIds.size > 0
      ? Vendor.find({ _id: { $in: Array.from(vendorIds) } }).select('name').lean()
      : [],
  ]);
  
  // Create lookup maps
  const categoryMap = new Map(categories.map((cat) => [cat._id.toString(), cat]));
  const vendorMap = new Map(vendors.map((ven) => [ven._id.toString(), ven]));
  
  // Populate products
  products.forEach((product) => {
    if (product.category && mongoose.Types.ObjectId.isValid(product.category)) {
      const category = categoryMap.get(product.category.toString());
      if (category) {
        product.category = category;
      }
    }
    if (product.vendor && mongoose.Types.ObjectId.isValid(product.vendor)) {
      const vendor = vendorMap.get(product.vendor.toString());
      if (vendor) {
        product.vendor = vendor;
      }
    }
  });
  
  const total = await Product.countDocuments(query);

  if (!products.length) {
    return sendNotFound(res, { message: 'No products found' });
  }

  sendSuccess(res, {
    data: products,
    message: 'Products retrieved successfully',
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

exports.getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid product id', statusCode: 400 });
  }

  const product = await Product.findById(id)
    .populate('category', 'name')
    .populate('vendor', 'name');

  if (!product) {
    return sendNotFound(res, { message: 'Product not found' });
  }

  sendSuccess(res, {
    data: product,
    message: 'Product retrieved successfully',
  });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const path = require('path');
  const fs = require('fs');

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid product id', statusCode: 400 });
  }

  // Get existing product to check for old images
  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    return sendNotFound(res, { message: 'Product not found' });
  }

  const updates = { ...req.body };

  // Handle uploaded files
  if (req.files && req.files.length > 0) {
    const newImageUrls = req.files.map((file) => `/uploads/products/${file.filename}`);
    
    // If new images are uploaded, replace old ones (delete old files if they exist)
    if (updates.replaceImages !== 'false' && existingProduct.images && existingProduct.images.length > 0) {
      const uploadsDir = path.join(__dirname, '../../uploads');
      existingProduct.images.forEach((imageUrl) => {
        if (imageUrl.startsWith('/uploads/')) {
          const filePath = path.join(uploadsDir, imageUrl.replace('/uploads/', ''));
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
            } catch (err) {
              console.error(`Error deleting old image: ${filePath}`, err);
            }
          }
        }
      });
    }
    
    updates.images = newImageUrls;
  } else if (updates.images !== undefined) {
    // Handle explicit images array (e.g., empty array to remove all images)
    if (Array.isArray(updates.images)) {
      if (updates.images.length === 0) {
        // Remove all images - delete files
        const uploadsDir = path.join(__dirname, '../../uploads');
        existingProduct.images.forEach((imageUrl) => {
          if (imageUrl.startsWith('/uploads/')) {
            const filePath = path.join(uploadsDir, imageUrl.replace('/uploads/', ''));
            if (fs.existsSync(filePath)) {
              try {
                fs.unlinkSync(filePath);
              } catch (err) {
                console.error(`Error deleting image file: ${filePath}`, err);
              }
            }
          }
        });
      }
      // Set to the provided array (could be empty or array of URLs)
      updates.images = updates.images;
    } else if (typeof updates.images === 'string') {
      try {
        // Try to parse as JSON
        const parsedImages = JSON.parse(updates.images);
        if (Array.isArray(parsedImages)) {
          if (parsedImages.length === 0) {
            // Remove all images
            const uploadsDir = path.join(__dirname, '../../uploads');
            existingProduct.images.forEach((imageUrl) => {
              if (imageUrl.startsWith('/uploads/')) {
                const filePath = path.join(uploadsDir, imageUrl.replace('/uploads/', ''));
                if (fs.existsSync(filePath)) {
                  try {
                    fs.unlinkSync(filePath);
                  } catch (err) {
                    console.error(`Error deleting image file: ${filePath}`, err);
                  }
                }
              }
            });
          }
          updates.images = parsedImages;
        }
      } catch (e) {
        // Not JSON, keep existing images
        delete updates.images;
      }
    }
  }
  
  // If no images field in updates and no files uploaded, keep existing images
  if (!updates.images && (!req.files || req.files.length === 0)) {
    // Don't update images field - keep existing
  }

  // Parse tags if it's a string
  if (updates.tags) {
    if (typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag);
    } else if (!Array.isArray(updates.tags)) {
      updates.tags = [];
    }
  }

  // Handle other fields
  if (updates.price !== undefined) {
    updates.price = Number(updates.price);
    if (updates.price < 0) {
      return sendError(res, {
        message: 'Price cannot be negative',
        statusCode: 400,
      });
    }
  }

  if (updates.stock !== undefined) {
    updates.stock = Number(updates.stock);
    if (updates.stock < 0) {
      return sendError(res, {
        message: 'Stock cannot be negative',
        statusCode: 400,
      });
    }
  }

  // Parse dimensions
  if (updates.dimensions && typeof updates.dimensions === 'string') {
    try {
      updates.dimensions = JSON.parse(updates.dimensions);
    } catch (e) {
      // Keep as is if parsing fails
    }
  }

  // Parse specifications
  if (updates.specifications && typeof updates.specifications === 'string') {
    try {
      updates.specifications = JSON.parse(updates.specifications);
    } catch (e) {
      updates.specifications = {};
    }
  }

  // Parse SEO
  if (updates.seo && typeof updates.seo === 'string') {
    try {
      updates.seo = JSON.parse(updates.seo);
    } catch (e) {
      // Keep as is if parsing fails
    }
  }

  // Convert featured to boolean
  if (updates.featured !== undefined) {
    updates.featured = updates.featured === true || updates.featured === 'true';
  }

  // Remove replaceImages from updates (it's just a flag)
  delete updates.replaceImages;

  const product = await Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate('category', 'name')
    .populate('vendor', 'name');

  if (!product) {
    return sendNotFound(res, { message: 'Product not found' });
  }

  sendSuccess(res, {
    data: product,
    message: 'Product updated successfully',
  });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const path = require('path');
  const fs = require('fs');

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid product id', statusCode: 400 });
  }

  const product = await Product.findById(id);
  
  if (!product) {
    return sendNotFound(res, { message: 'Product not found' });
  }

  // Delete associated image files
  if (product.images && product.images.length > 0) {
    const uploadsDir = path.join(__dirname, '../../uploads');
    product.images.forEach((imageUrl) => {
      if (imageUrl.startsWith('/uploads/')) {
        const filePath = path.join(uploadsDir, imageUrl.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error(`Error deleting image file: ${filePath}`, err);
          }
        }
      }
    });
  }

  await Product.findByIdAndDelete(id);

  sendSuccess(res, {
    data: null,
    message: 'Product deleted successfully',
  });
});

