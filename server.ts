
const express = require('express');
const testRoute = require('./routes/testRoutes');
const apiRoutes = require('./routes/api');
const { testConnection } = require('./utils/db');
const { specs, swaggerUi } = require('./config/swagger');

// Load environment variables from .env file
require('dotenv').config();

// Import types for TypeScript
import { Request, Response, NextFunction } from 'express';

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Buddies Inn API Documentation',
}));

// Root route - basic server status message
app.get('/', (req: Request, res: Response) => {
  res.send(`🚀 Buddies Inn Backend server running on port ${PORT}.<br><a href="/api-docs">📚 View API Documentation</a>`);
});

// Mount test routes under /api/test
app.use('/api/test', testRoute);

// Mount API routes under /api
app.use('/api', apiRoutes);

// Enhanced health check route for monitoring server status
app.get('/api/health', (req: Request, res: Response) => {
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
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} does not exist`
  });
});

// Global error handler - handles invalid JSON and other errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    // Handle invalid JSON error
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  // Log error stack and send generic error response
  console.error(err.stack);
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Set server port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Initialize database connection and start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start the server and listen on the specified port
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', (error as Error).message);
    process.exit(1);
  }
};

// Start the application
startServer();