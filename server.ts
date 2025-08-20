
const express = require('express');
const testRoute = require('./routes/testRoutes');
const apiRoutes = require('./routes/api');
const { testConnection } = require('./utils/db');
const { specs, swaggerUi } = require('./config/swagger');

// Load environment variables from .env file
require('dotenv').config();

// Import types for TypeScript
import { Request, Response, NextFunction } from 'express';

// Enhanced logging function
const log = (level: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

// Log startup information
log('info', '🚀 Starting Buddies Inn Backend Server...');
log('info', `Environment: ${process.env.NODE_ENV || 'development'}`);
log('info', `Port: ${process.env.PORT || 3000}`);
log('info', `Database URL configured: ${!!process.env.DATABASE_URL}`);
log('info', `JWT Secret configured: ${!!process.env.JWT_SECRET}`);

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

log('info', '✅ Express middleware configured');

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  log('info', `📥 ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    query: req.query,
    headers: Object.keys(req.headers)
  });
  next();
});

// Error catching middleware for route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((error: Error) => {
    log('error', `Async handler error in ${req.method} ${req.path}:`, {
      message: error.message,
      stack: error.stack
    });
    next(error);
  });
};

// Swagger documentation with error handling
try {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Buddies Inn API Documentation',
  }));
  log('info', '📚 Swagger documentation configured at /api-docs');
} catch (error) {
  log('error', 'Failed to configure Swagger documentation:', error);
}

// Root route - basic server status message
app.get('/', asyncHandler((req: Request, res: Response) => {
  const serverInfo = {
    message: '🚀 Buddies Inn Backend server is running!',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      docs: '/api-docs',
      api: '/api'
    }
  };
  log('info', '📋 Root endpoint accessed');
  res.json(serverInfo);
}));

// Debug endpoint to check environment variables (without exposing secrets)
app.get('/debug', asyncHandler((req: Request, res: Response) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    hasDatabase: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeVersion: process.version,
    platform: process.platform,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  log('info', '🔍 Debug endpoint accessed', debugInfo);
  res.json(debugInfo);
}));

// Mount test routes under /api/test with error handling
try {
  app.use('/api/test', testRoute);
  log('info', '🧪 Test routes mounted at /api/test');
} catch (error) {
  log('error', 'Failed to mount test routes:', error);
}

// Mount API routes under /api with error handling
try {
  app.use('/api', apiRoutes);
  log('info', '🔌 API routes mounted at /api');
} catch (error) {
  log('error', 'Failed to mount API routes:', error);
}

// Enhanced health check route for monitoring server status
app.get('/api/health', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Test database connection
    const dbStatus = await testConnection();
    const responseTime = Date.now() - startTime;
    
    const healthInfo = {
      status: 'ok',
      message: 'Health check passed',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      responseTime: `${responseTime}ms`,
      database: {
        connected: dbStatus,
        url: process.env.DATABASE_URL ? 'configured' : 'missing'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
        jwtSecret: process.env.JWT_SECRET ? 'configured' : 'missing'
      },
      memory: process.memoryUsage(),
      version: process.version
    };
    
    log('info', '💓 Health check completed', { 
      dbConnected: dbStatus, 
      responseTime: `${responseTime}ms` 
    });
    
    res.status(200).json(healthInfo);
  } catch (error) {
    log('error', 'Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// 404 handler - catches all unknown routes
app.use((req: Request, res: Response, next: NextFunction) => {
  log('warn', `🔍 404 - Route not found: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/',
      '/debug',
      '/api/health',
      '/api-docs',
      '/api/test',
      '/api'
    ]
  });
});

// Global error handler - handles invalid JSON and other errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  log('error', `💥 Global error handler triggered for ${req.method} ${req.path}:`, {
    message: err.message,
    stack: err.stack,
    code: err.code,
    status: err.status
  });

  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    // Handle invalid JSON error
    return res.status(400).json({ 
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON',
      timestamp: new Date().toISOString()
    });
  }

  // Handle database connection errors
  if (err.code === 'P1001' || err.code === 'P1008') {
    return res.status(503).json({
      error: 'Database Connection Error',
      message: 'Unable to connect to the database',
      timestamp: new Date().toISOString()
    });
  }

  // Log error stack and send generic error response
  return res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Set server port from environment or default to 3000
const PORT = process.env.PORT || 3000;

// Initialize database connection and start server
const startServer = async () => {
  try {
    log('info', '🔌 Attempting database connection...');
    
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      log('error', '❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    log('info', '✅ Database connection successful');

    // Start the server and listen on the specified port
    const server = app.listen(PORT, () => {
      log('info', `🚀 Server listening on port ${PORT}`);
      log('info', `🌐 Server URL: http://localhost:${PORT}`);
      log('info', `📊 Health check: http://localhost:${PORT}/api/health`);
      log('info', `🔍 Debug info: http://localhost:${PORT}/debug`);
      log('info', `📚 API Documentation: http://localhost:${PORT}/api-docs`);
      log('info', '✨ Server startup completed successfully');
    });

    // Handle server errors
    server.on('error', (error: Error) => {
      log('error', '💥 Server error:', error);
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      log('info', '🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        log('info', '✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      log('info', '🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        log('info', '✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    log('error', '❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  log('error', '💥 Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  log('error', '💥 Unhandled Rejection at:', { reason, promise });
  process.exit(1);
});

log('info', '🚀 Initializing server startup...');

// Start the application
startServer();