const express = require('express');
import { Request, Response } from 'express';
import productRoutes from './products';
import cartRoutes from './cart';
import orderRoutes from './orders';
import authRoutes from './auth';
import reviewRoutes from './reviews';
import categoryRoutes from './categories';
import usersRouter from './users';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization
 *   - name: Categories
 *     description: Product category management
 *   - name: Products
 *     description: Product catalog management
 *   - name: Cart
 *     description: Shopping cart operations
 *   - name: Orders
 *     description: Order management
 *   - name: Reviews
 *     description: Product reviews and ratings
 *   - name: Health
 *     description: API health and status checks
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: API health check
 *     description: Check if the API is running and get system information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 message:
 *                   type: string
 *                   example: "API is running"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 */
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
router.use('/categories', categoryRoutes);
router.use('/users', usersRouter);

module.exports = router;
