const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/user.routes');
const roleRoutes = require('./routes/role.routes');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const vendorRoutes = require('./routes/vendor.routes');
const categoryRoutes = require('./routes/category.routes');
const addressRoutes = require('./routes/address.routes');
const customerActivityLogRoutes = require('./routes/customerActivityLog.routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/customer-activity-logs', customerActivityLogRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

