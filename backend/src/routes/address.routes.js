const express = require('express');
const {
  getMyAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require('../controllers/address.controller');
const authenticate = require('../middlewares/authenticate');
const { logActivity } = require('../middlewares/activityLogger');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.route('/')
  .get(logActivity('view_addresses'), getMyAddresses)
  .post(logActivity('add_address'), createAddress);

router.route('/:id')
  .get(logActivity('view_addresses'), getAddressById)
  .put(logActivity('update_address'), updateAddress)
  .delete(logActivity('delete_address'), deleteAddress);

router.put('/:id/default', setDefaultAddress);

module.exports = router;

