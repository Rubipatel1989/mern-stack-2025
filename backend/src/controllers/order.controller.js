const mongoose = require('mongoose');

const Order = require('../models/order.model');
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shippingAddress, paymentMethod, notes, tax = 0, shipping = 0 } = req.body;

  if (!shippingAddress || !shippingAddress.line1 || !shippingAddress.city) {
    return sendError(res, {
      message: 'Shipping address is required',
      statusCode: 400,
    });
  }

  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || !cart.items.length) {
    return sendError(res, {
      message: 'Cart is empty',
      statusCode: 400,
    });
  }

  // Validate products and build order items
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.product._id);
    if (!product || product.status !== 'active') {
      return sendError(res, {
        message: `Product ${cartItem.product.name || cartItem.product._id} is not available`,
        statusCode: 400,
      });
    }

    if (product.stock < cartItem.quantity) {
      return sendError(res, {
        message: `Insufficient stock for ${product.name}`,
        statusCode: 400,
      });
    }

    const itemTotal = cartItem.price * cartItem.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      quantity: cartItem.quantity,
      price: cartItem.price,
      total: itemTotal,
    });
  }

  const total = subtotal + Number(tax) + Number(shipping);

  const order = await Order.create({
    user: userId,
    items: orderItems,
    subtotal,
    tax: Number(tax),
    shipping: Number(shipping),
    total,
    shippingAddress,
    paymentMethod: paymentMethod || 'cash',
    notes,
  });

  // Update product stock
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  await order.populate('user', 'name email');

  sendSuccess(res, {
    data: order,
    message: 'Order placed successfully',
    statusCode: 201,
  });
});

exports.getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, userId } = req.query;
  const requesterRole = req.user.role?.toLowerCase();

  const query = {};

  // Customers can only see their own orders
  if (requesterRole === 'customer' || requesterRole === 'support') {
    query.user = req.user.id;
  } else if (userId && (requesterRole === 'admin' || requesterRole === 'superadmin')) {
    query.user = userId;
  }

  if (status) {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query),
  ]);

  if (!orders.length) {
    return sendNotFound(res, { message: 'No orders found' });
  }

  sendSuccess(res, {
    data: orders,
    message: 'Orders retrieved successfully',
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.user.role?.toLowerCase();

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid order id', statusCode: 400 });
  }

  const query = { _id: id };

  // Customers can only see their own orders
  if (requesterRole === 'customer' || requesterRole === 'support') {
    query.user = req.user.id;
  }

  const order = await Order.findOne(query)
    .populate('user', 'name email phone address')
    .populate('items.product', 'name images description')
    .populate('approvedBy', 'name email');

  if (!order) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  sendSuccess(res, {
    data: order,
    message: 'Order retrieved successfully',
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const requesterRole = req.user.role?.toLowerCase();

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid order id', statusCode: 400 });
  }

  const validStatuses = ['pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return sendError(res, {
      message: `Status must be one of: ${validStatuses.join(', ')}`,
      statusCode: 400,
    });
  }

  // Only admin/superadmin can update order status
  if (requesterRole !== 'admin' && requesterRole !== 'superadmin') {
    return sendError(res, {
      message: 'You do not have permission to update order status',
      statusCode: 403,
    });
  }

  const updateData = { status };
  if (notes) {
    updateData.notes = notes;
  }

  if (status === 'approved') {
    updateData.approvedBy = req.user.id;
    updateData.approvedAt = new Date();
  }

  const order = await Order.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .populate('approvedBy', 'name email');

  if (!order) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  sendSuccess(res, {
    data: order,
    message: 'Order status updated successfully',
  });
});

exports.deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterRole = req.user.role?.toLowerCase();

  if (!isValidObjectId(id)) {
    return sendError(res, { message: 'Invalid order id', statusCode: 400 });
  }

  // Only superadmin can delete orders
  if (requesterRole !== 'superadmin') {
    return sendError(res, {
      message: 'You do not have permission to delete orders',
      statusCode: 403,
    });
  }

  const order = await Order.findByIdAndDelete(id);

  if (!order) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  sendSuccess(res, {
    data: null,
    message: 'Order deleted successfully',
  });
});

