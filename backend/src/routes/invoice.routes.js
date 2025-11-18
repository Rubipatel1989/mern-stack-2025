const express = require('express');

const { getInvoice, getInvoiceHTML } = require('../controllers/invoice.controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/:orderId', getInvoice);
router.get('/:orderId/html', getInvoiceHTML);

module.exports = router;

