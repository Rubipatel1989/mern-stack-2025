const express = require('express');

const { createRole, getRoles } = require('../controllers/role.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);

router.post('/', authorizeRoles('superadmin'), createRole);
router.get('/', authorizeRoles('superadmin', 'admin'), getRoles);

module.exports = router;

