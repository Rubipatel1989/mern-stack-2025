const express = require('express');

const { getInvoice, getInvoiceHTML, downloadInvoice } = require('../controllers/invoice.controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.use(authenticate);

router.get('/:orderId', getInvoice);
router.get('/:orderId/html', getInvoiceHTML);
router.get('/:orderId/download', downloadInvoice);

module.exports = router;

