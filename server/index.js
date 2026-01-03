require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const marketDataRoutes = require('./routes/marketData');
const analysisRoutes = require('./routes/analysis');
const portfolioRoutes = require('./routes/portfolio');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/market-data', marketDataRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: 'Route not found',
      status: 404
    }
  });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mean-quant';

const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

startServer();

module.exports = app;
