const express = require('express');
import { Request, Response } from 'express';
import productRoutes from './products';

const router = express.Router();

// Health check route
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/products', productRoutes);


module.exports = router;
