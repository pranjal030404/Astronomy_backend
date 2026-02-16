require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies
}));
app.use(express.json({ limit: '10mb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Cookie parser
app.use(morgan('dev')); // Logging

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const feedRoutes = require('./routes/feed');
const shopRoutes = require('./routes/shop');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/shop', shopRoutes);

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

// Welcome route
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}/api/v1`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/v1/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
