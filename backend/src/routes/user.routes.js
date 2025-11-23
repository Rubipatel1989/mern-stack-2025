const express = require('express');

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/user.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');

const router = express.Router();

router.use(authenticate);

router.get('/me', logActivity('view_profile'), getMyProfile);
router.put('/me', logActivity('update_profile'), updateMyProfile);
router.get('/', authorizeRoles('superadmin', 'admin', 'support'), getUsers);
router.get('/:id', authorizeRoles('superadmin', 'admin', 'support'), getUserById);
router.post('/', authorizeRoles('superadmin', 'admin'), createUser);
router.put('/:id', authorizeRoles('superadmin', 'admin'), updateUser);
router.delete('/:id', authorizeRoles('superadmin'), deleteUser);

module.exports = router;

