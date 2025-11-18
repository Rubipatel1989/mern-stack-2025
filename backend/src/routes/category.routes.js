const express = require('express');

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

const router = express.Router();

// Public route to get active categories
router.get('/', getCategories);

// Protected routes
router.use(authenticate);

router.get('/:id', getCategoryById);
router.post('/', authorizeRoles('superadmin', 'admin'), createCategory);
router.put('/:id', authorizeRoles('superadmin', 'admin'), updateCategory);
router.delete('/:id', authorizeRoles('superadmin', 'admin'), deleteCategory);

module.exports = router;

