const express = require('express');

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  reorder,
} = require('../controllers/cart.controller');
const authenticate = require('../middlewares/authenticate');
const { logActivity } = require('../middlewares/activityLogger');

const router = express.Router();

router.use(authenticate);

router.get('/', logActivity('view_cart'), getCart);
router.post('/add', logActivity('add_to_cart'), addToCart);
router.post('/reorder', reorder);
router.put('/item/:itemId', logActivity('update_cart'), updateCartItem);
router.delete('/item/:itemId', logActivity('remove_from_cart'), removeFromCart);
router.delete('/clear', logActivity('update_cart', { description: 'Cart cleared' }), clearCart);

module.exports = router;

