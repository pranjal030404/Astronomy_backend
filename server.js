// Load environment-specific .env file (.env.production in prod, .env otherwise)
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: envFile });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Connect to database
connectDB();

const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers with CORS for images

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_LAN,
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:5173',
  // LAN access from other devices on the same network
  'http://192.168.1.21:3000',
  'http://192.168.1.21:5173',
  'http://192.168.1.21:5000',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    // Return a proper 403 — not an Error — so Express doesn't treat it as a 500
    callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Cookie parser
app.use(morgan(isProd ? 'combined' : 'dev')); // Logging

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const feedRoutes = require('./routes/feed');
const shopRoutes = require('./routes/shop');
const statsRoutes = require('./routes/stats');
const eventsRoutes = require('./routes/events');
const notificationRoutes = require('./routes/notifications');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/shop', shopRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Comment routes for posts (nested)
const commentController = require('./controllers/commentController');
const { protect } = require('./middleware/auth');
app.get('/api/v1/posts/:postId/comments', commentController.getComments);
app.post('/api/v1/posts/:postId/comments', protect, commentController.createComment);

// Health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Astronomy Lover API is running',
    timestamp: new Date().toISOString(),
  });
});

// Welcome route (dev only — production serves the React app from '/')
if (!isProd) {
  app.get('/', (req, res) => {
    res.json({
      message: '🌌 Welcome to Astronomy Lover API',
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
      },
    });
  });
}

// Serve React production build in production mode
if (isProd) {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));
  // SPA catch-all: send index.html for any non-API route
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // 404 handler for dev (API-only)
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });
}

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server — bind to 0.0.0.0 so it's reachable on the network
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  const displayHost = process.env.CLIENT_URL || `http://localhost:${PORT}`;
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📍 API: ${displayHost}/api/v1`);
  console.log(`🌐 Health: ${displayHost}/api/v1/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
