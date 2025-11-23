const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { logCustomActivity } = require('../middlewares/activityLogger');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');

exports.getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let cart = await Cart.findOne({ user: userId }).populate('items.product');

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  sendSuccess(res, {
    data: cart,
    message: 'Cart retrieved successfully',
  });
});

exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return sendError(res, {
      message: 'Product ID is required',
      statusCode: 400,
    });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return sendError(res, {
      message: 'Product not found',
      statusCode: 404,
    });
  }

  if (product.status !== 'active') {
    return sendError(res, {
      message: 'Product is not available',
      statusCode: 400,
    });
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  await cart.save();
  await cart.populate('items.product');

  sendSuccess(res, {
    data: cart,
    message: 'Item added to cart successfully',
  });
});

exports.updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return sendError(res, {
      message: 'Quantity must be at least 1',
      statusCode: 400,
    });
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return sendError(res, {
      message: 'Cart not found',
      statusCode: 404,
    });
  }

  const item = cart.items.id(itemId);
  if (!item) {
    return sendError(res, {
      message: 'Cart item not found',
      statusCode: 404,
    });
  }

  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product');

  sendSuccess(res, {
    data: cart,
    message: 'Cart item updated successfully',
  });
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return sendError(res, {
      message: 'Cart not found',
      statusCode: 404,
    });
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== itemId);
  await cart.save();
  await cart.populate('items.product');

  sendSuccess(res, {
    data: cart,
    message: 'Item removed from cart successfully',
  });
});

exports.clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    return sendError(res, {
      message: 'Cart not found',
      statusCode: 404,
    });
  }

  cart.items = [];
  await cart.save();

  sendSuccess(res, {
    data: cart,
    message: 'Cart cleared successfully',
  });
});

exports.reorder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;

  if (!orderId) {
    return sendError(res, {
      message: 'Order ID is required',
      statusCode: 400,
    });
  }

  const Order = require('../models/order.model');
  const order = await Order.findById(orderId).populate('items.product');

  if (!order) {
    return sendError(res, {
      message: 'Order not found',
      statusCode: 404,
    });
  }

  if (order.user.toString() !== userId) {
    return sendError(res, {
      message: 'Unauthorized',
      statusCode: 403,
    });
  }

  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  // Add all items from order to cart
  for (const orderItem of order.items) {
    const productId = orderItem.product?._id || orderItem.product;
    const product = await Product.findById(productId);
    
    if (product && product.status === 'active') {
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId.toString()
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += orderItem.quantity;
      } else {
        cart.items.push({
          product: productId,
          quantity: orderItem.quantity,
          price: product.price,
        });
      }
    }
  }

  await cart.save();
  await cart.populate('items.product');

  // Log reorder activity
  await logCustomActivity(userId, 'reorder', {
    description: `Reordered items from order ${order.orderNumber}`,
    resourceId: orderId,
    resourceType: 'order',
    metadata: {
      orderNumber: order.orderNumber,
      itemsCount: order.items.length,
    },
  });

  sendSuccess(res, {
    data: cart,
    message: 'Items reordered successfully',
  });
});

