// Import required modules
const express = require('express');
const testRoute = require('./routes/testRoutes');

// Load environment variables from .env file
require('dotenv').config();

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Root route - basic server status message
app.get('/', (req, res) => {
  res.send(`🚀 Buddies Inn Backend server running on port ${PORT}.`);
});

// Mount test routes under /api/test
app.use('/api/test', testRoute);

// Enhanced health check route for monitoring server status
app.get('/api/health', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  res.status(200).json({
    status: 'ok',
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external
    }
  });
});

// 404 handler - catches all unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} does not exist`
  });
});

// Global error handler - handles invalid JSON and other errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // Handle invalid JSON error
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  // Log error stack and send generic error response
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Set server port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});