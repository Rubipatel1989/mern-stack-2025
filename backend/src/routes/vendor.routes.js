const express = require('express');

const {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
} = require('../controllers/vendor.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

const router = express.Router();

// Public route to get active vendors
router.get('/', getVendors);

// Protected routes
router.use(authenticate);

router.get('/:id', getVendorById);
router.post('/', authorizeRoles('superadmin', 'admin'), createVendor);
router.put('/:id', authorizeRoles('superadmin', 'admin'), updateVendor);
router.delete('/:id', authorizeRoles('superadmin', 'admin'), deleteVendor);

module.exports = router;

