const express = require('express');

const {
  login,
  logout,
  registerSuperAdmin,
} = require('../controllers/auth.controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticate, logout);
router.post('/register-superadmin', registerSuperAdmin);

module.exports = router;

