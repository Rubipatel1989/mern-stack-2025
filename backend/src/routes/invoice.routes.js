const express = require('express');

const { getInvoice, getInvoiceHTML, downloadInvoice } = require('../controllers/invoice.controller');
const authenticate = require('../middlewares/authenticate');
const { logActivity } = require('../middlewares/activityLogger');

const router = express.Router();

router.use(authenticate);

router.get('/:orderId', logActivity('view_invoice'), getInvoice);
router.get('/:orderId/html', logActivity('view_invoice'), getInvoiceHTML);
router.get('/:orderId/download', logActivity('download_invoice'), downloadInvoice);

module.exports = router;

