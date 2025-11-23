const express = require('express');
const router = express.Router();
const {
  getAllErrorLogs,
  getErrorLogById,
  resolveErrorLog,
  getErrorStatistics,
  deleteErrorLog,
} = require('../controllers/errorLog.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// All routes require authentication and admin/superadmin role
router.use(authenticate);
router.use(authorizeRoles('admin', 'superadmin'));

router.get('/', getAllErrorLogs);
router.get('/statistics', getErrorStatistics);
router.get('/:id', getErrorLogById);
router.put('/:id/resolve', resolveErrorLog);
router.delete('/:id', deleteErrorLog);

module.exports = router;

