const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars (try local .env if available, otherwise process.env from Vercel)
try {
  dotenv.config({ path: path.join(__dirname, '../server/.env') });
} catch (e) {
  dotenv.config();
}

const { connectDB } = require('../server/config/db');
const errorHandler = require('../server/middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Normalize Vercel Serverless req.url to ensure /api prefix is always present
app.use((req, res, next) => {
  if (req.url === '/' || req.url === '') {
    req.url = '/api/health';
  } else if (!req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Ensure DB is connected per request on serverless environment
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in Vercel function:', err.message);
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    environment: 'Vercel Serverless Function',
    message: 'Restaurant Smart QR Table Ordering System API is running smoothly',
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/platform', require('../server/routes/platformAdminRoutes'));
app.use('/api/auth', require('../server/routes/authRoutes'));
app.use('/api/restaurants', require('../server/routes/restaurantRoutes'));
app.use('/api/tables', require('../server/routes/tableRoutes'));
app.use('/api/qr', require('../server/routes/qrRoutes'));
app.use('/api/menu', require('../server/routes/menuRoutes'));
app.use('/api/orders', require('../server/routes/orderRoutes'));
app.use('/api/kitchen', require('../server/routes/kitchenRoutes'));
app.use('/api/billing', require('../server/routes/billingRoutes'));
app.use('/api/payments', require('../server/routes/paymentRoutes'));
app.use('/api/waiter-calls', require('../server/routes/waiterCallRoutes'));
app.use('/api/analytics', require('../server/routes/analyticsRoutes'));
app.use('/api/inventory', require('../server/routes/inventoryRoutes'));
app.use('/api/offers', require('../server/routes/offerRoutes'));
app.use('/api/customers', require('../server/routes/customerRoutes'));
app.use('/api/feedback', require('../server/routes/feedbackRoutes'));

// 404 handler for unmatched API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Endpoint ${req.originalUrl || req.url} not found`
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
