const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'Restaurant Smart QR Table Ordering System API is running smoothly',
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/qr', require('./routes/qrRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/kitchen', require('./routes/kitchenRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/waiter-calls', require('./routes/waiterCallRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// 404 Route handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server and connect DB
const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log(`🚀 Server listening in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    });

    const isConnected = await connectDB();
    if (isConnected) {
      // Check if database needs seeding
      const Restaurant = require('./models/Restaurant');
      const count = await Restaurant.countDocuments();
      if (count === 0) {
        console.log('📦 Empty database detected. Auto-populating initial restaurant data...');
        const seedDatabase = require('./seed/seedData');
        await seedDatabase();
      }
    }
  } catch (err) {
    console.error('❌ Server startup notice:', err.message);
  }
};

startServer();

