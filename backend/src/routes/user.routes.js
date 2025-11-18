const express = require('express');

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles('superadmin', 'admin', 'support'), getUsers);
router.get('/:id', authorizeRoles('superadmin', 'admin', 'support'), getUserById);
router.post('/', authorizeRoles('superadmin', 'admin'), createUser);
router.put('/:id', authorizeRoles('superadmin', 'admin'), updateUser);
router.delete('/:id', authorizeRoles('superadmin'), deleteUser);

module.exports = router;

