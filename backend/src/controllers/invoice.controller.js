const Order = require('../models/order.model');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError, sendNotFound } = require('../utils/response');

const generateInvoiceNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${String(random).padStart(3, '0')}`;
};

exports.getInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const requesterRole = req.user.role?.toLowerCase();

  const query = { _id: orderId };

  // Customers can only see their own invoices
  if (requesterRole === 'customer' || requesterRole === 'support') {
    query.user = req.user.id;
  }

  const order = await Order.findOne(query)
    .populate('user', 'name email phone address')
    .populate('items.product', 'name description')
    .populate('approvedBy', 'name email');

  if (!order) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  // Generate invoice number if not exists
  if (!order.invoiceNumber) {
    order.invoiceNumber = generateInvoiceNumber();
    await order.save();
  }

  sendSuccess(res, {
    data: order,
    message: 'Invoice retrieved successfully',
  });
});

exports.getInvoiceHTML = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const requesterRole = req.user.role?.toLowerCase();

  const query = { _id: orderId };

  if (requesterRole === 'customer' || requesterRole === 'support') {
    query.user = req.user.id;
  }

  const order = await Order.findOne(query)
    .populate('user', 'name email phone address')
    .populate('items.product', 'name description')
    .populate('approvedBy', 'name email');

  if (!order) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  if (!order.invoiceNumber) {
    order.invoiceNumber = generateInvoiceNumber();
    await order.save();
  }

  const invoiceDate = new Date(order.approvedAt || order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${order.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #333; margin-bottom: 10px; }
    .header p { color: #666; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-box { flex: 1; }
    .info-box h3 { color: #333; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
    .info-box p { color: #666; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    table th { background: #333; color: white; padding: 12px; text-align: left; }
    table td { padding: 12px; border-bottom: 1px solid #ddd; }
    table tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .totals { margin-top: 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>INVOICE</h1>
      <p>Invoice #${order.invoiceNumber} | Date: ${invoiceDate}</p>
    </div>
    
    <div class="info-section">
      <div class="info-box">
        <h3>Bill To</h3>
        <p><strong>${order.user.name || order.user.email}</strong></p>
        <p>${order.user.email}</p>
        ${order.user.phone ? `<p>${order.user.phone}</p>` : ''}
        ${order.shippingAddress ? `
          <p>${order.shippingAddress.line1}</p>
          ${order.shippingAddress.line2 ? `<p>${order.shippingAddress.line2}</p>` : ''}
          <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
          <p>${order.shippingAddress.country}</p>
        ` : ''}
      </div>
      <div class="info-box">
        <h3>Order Details</h3>
        <p><strong>Order #:</strong> ${order.orderNumber}</p>
        <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
        ${order.approvedBy ? `<p><strong>Approved by:</strong> ${order.approvedBy.name}</p>` : ''}
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item) => `
        <tr>
          <td>${item.name}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">$${item.price.toFixed(2)}</td>
          <td class="text-right">$${item.total.toFixed(2)}</td>
        </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>$${order.subtotal.toFixed(2)}</span>
      </div>
      ${order.tax > 0 ? `
      <div class="totals-row">
        <span>Tax:</span>
        <span>$${order.tax.toFixed(2)}</span>
      </div>
      ` : ''}
      ${order.shipping > 0 ? `
      <div class="totals-row">
        <span>Shipping:</span>
        <span>$${order.shipping.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>Total:</span>
        <span>$${order.total.toFixed(2)}</span>
      </div>
    </div>
    
    ${order.notes ? `
    <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #333;">
      <strong>Notes:</strong> ${order.notes}
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>This is a computer-generated invoice.</p>
    </div>
  </div>
  
  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 20px; background: #333; color: white; border: none; cursor: pointer; border-radius: 4px;">
      Print / Save as PDF
    </button>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

exports.downloadInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const requesterRole = req.requesterRole || (typeof req.user.role === 'string' 
    ? req.user.role.toLowerCase() 
    : req.user.role?.name?.toLowerCase() || '');

  const query = { _id: orderId };

  if (requesterRole === 'customer' || requesterRole === 'support') {
    query.user = req.user.id;
  }

  const order = await Order.findOne(query)
    .populate('user', 'name email phone address')
    .populate('items.product', 'name description')
    .populate('approvedBy', 'name email');

  if (!order) {
    return sendNotFound(res, { message: 'Order not found' });
  }

  if (!order.invoiceNumber) {
    order.invoiceNumber = generateInvoiceNumber();
    await order.save();
  }

  const invoiceDate = new Date(order.approvedAt || order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${order.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #333; margin-bottom: 10px; }
    .header p { color: #666; }
    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .info-box { flex: 1; }
    .info-box h3 { color: #333; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
    .info-box p { color: #666; margin: 5px 0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    table th { background: #333; color: white; padding: 12px; text-align: left; }
    table td { padding: 12px; border-bottom: 1px solid #ddd; }
    table tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .totals { margin-top: 20px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .totals-row.total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>INVOICE</h1>
      <p>Invoice #${order.invoiceNumber} | Date: ${invoiceDate}</p>
    </div>
    
    <div class="info-section">
      <div class="info-box">
        <h3>Bill To</h3>
        <p><strong>${order.user.name || order.user.email}</strong></p>
        <p>${order.user.email}</p>
        ${order.user.phone ? `<p>${order.user.phone}</p>` : ''}
        ${order.shippingAddress ? `
          <p>${order.shippingAddress.line1}</p>
          ${order.shippingAddress.line2 ? `<p>${order.shippingAddress.line2}</p>` : ''}
          <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
          <p>${order.shippingAddress.country}</p>
        ` : ''}
      </div>
      <div class="info-box">
        <h3>Order Details</h3>
        <p><strong>Order #:</strong> ${order.orderNumber}</p>
        <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
        <p><strong>Payment:</strong> ${order.paymentMethod.toUpperCase()}</p>
        ${order.approvedBy ? `<p><strong>Approved by:</strong> ${order.approvedBy.name}</p>` : ''}
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.items
          .map(
            (item) => `
        <tr>
          <td>${item.name}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">$${item.price.toFixed(2)}</td>
          <td class="text-right">$${item.total.toFixed(2)}</td>
        </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
    
    <div class="totals">
      <div class="totals-row">
        <span>Subtotal:</span>
        <span>$${order.subtotal.toFixed(2)}</span>
      </div>
      ${order.tax > 0 ? `
      <div class="totals-row">
        <span>Tax:</span>
        <span>$${order.tax.toFixed(2)}</span>
      </div>
      ` : ''}
      ${order.shipping > 0 ? `
      <div class="totals-row">
        <span>Shipping:</span>
        <span>$${order.shipping.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="totals-row total">
        <span>Total:</span>
        <span>$${order.total.toFixed(2)}</span>
      </div>
    </div>
    
    ${order.notes ? `
    <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-left: 4px solid #333;">
      <strong>Notes:</strong> ${order.notes}
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>This is a computer-generated invoice.</p>
    </div>
  </div>
</body>
</html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.invoiceNumber}.html"`);
  res.send(html);
});

