const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const redis = require('redis');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const { authenticateToken } = require('./middleware/auth');
require('dotenv').config();

const app = express();

let redisClient;
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Only connect to Redis if not in test environment
if (!isTestEnvironment) {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  redisClient.connect().catch(console.error);
  
  // Make redisClient available through app
  app.set('redisClient', redisClient);
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('Connected to MongoDB'))
      .catch(err => console.error('Failed to connect to MongoDB', err));
  }
  
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    if (!isTestEnvironment) {
      console.log(`Server running on port ${PORT}`);
    }
  });
  
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
      if (redisClient) redisClient.quit();
      mongoose.connection.close();
    });
  });

module.exports = { app, server }; 