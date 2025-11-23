const express = require('express');
const router = express.Router();
const {
  getStates,
  getStateById,
  createState,
  updateState,
  deleteState,
} = require('../controllers/state.controller');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles } = require('../middlewares/authorize');

// Public route - anyone can get states (for address forms)
router.get('/', getStates);
router.get('/:id', getStateById);

// Protected routes - only admins can manage states
router.use(authenticate);
router.use(authorizeRoles('admin', 'superadmin'));

router.post('/', createState);
router.put('/:id', updateState);
router.delete('/:id', deleteState);

module.exports = router;

