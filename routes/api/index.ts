const express = require('express');
import { Request, Response } from 'express';
import productRoutes from './products';
import cartRoutes from './cart';
import orderRoutes from './orders';
import authRoutes from './auth';
import reviewRoutes from './reviews';

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
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/auth', authRoutes);
router.use('/reviews', reviewRoutes);

module.exports = router;
