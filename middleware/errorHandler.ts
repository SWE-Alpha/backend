import express , { NextFunction, Request, Response } from 'express';

// Error handling middleware
const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error(err.stack);

  // Prisma errors
  if (err.code === 'P2002') {
    res.status(400).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    });
    return;
  }

  
  if (err.code === 'P2025') {
    res.status(404).json({
      error: 'Not found',
      message: 'The requested resource was not found'
    });
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details || []
    });
    return;
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

// Request validation middleware
const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      const validationError: any = new Error(error.details[0].message);
      validationError.name = 'ValidationError';
      validationError.details = error.details;
      return next(validationError);
    }
    next();
  };
};

// Async wrapper to catch errors in async route handlers
const asyncHandler = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  validateRequest,
  asyncHandler
};
