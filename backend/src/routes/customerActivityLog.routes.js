const express = require('express');
const {
  getAllActivityLogs,
  getUserActivityLogs,
  getActivityStatistics,
} = require('../controllers/customerActivityLog.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

const router = express.Router();

// All routes require authentication and admin/superadmin role
router.use(authenticate);
router.use(authorizeRoles('admin', 'superadmin'));

// Get all activity logs
router.get('/', getAllActivityLogs);

// Get activity statistics
router.get('/statistics', getActivityStatistics);

// Get activity logs for a specific user
router.get('/user/:userId', getUserActivityLogs);

module.exports = router;

