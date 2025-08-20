import { Request, Response } from 'express';
const { prisma } = require('../utils/db');

type AuthedRequest = Request & { user?: { id: string } };

/**
 * @swagger
 * /api/products/{productId}/reviews:
 *   get:
 *     summary: Get product reviews
 *     description: Retrieve all approved reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Unique identifier of the product
 *         schema:
 *           type: string
 *           example: "product_123456789"
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Review'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create product review
 *     description: Create a new review for a product (one review per user per product)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         description: Unique identifier of the product to review
 *         schema:
 *           type: string
 *           example: "product_123456789"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *                 description: Rating from 1 to 5 stars
 *               title:
 *                 type: string
 *                 example: "Great product!"
 *                 description: Optional review title
 *               comment:
 *                 type: string
 *                 example: "This product exceeded my expectations. Highly recommended!"
 *                 description: Optional detailed review comment
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         description: Bad request - invalid rating or user already reviewed this product
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// GET /api/products/:productId/reviews
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { productId, status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        verified: true,
        status: true,
        createdAt: true,
        user: { select: { id: true, userName: true } }
      }
    });
    return res.json({ success: true, data: reviews });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch reviews', message: err.message });
  }
};

// POST /api/products/:productId/reviews
export const createReview = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'unauthorized' });

    const { productId } = req.params;
    const { rating, title, comment } = req.body || {};
    const r = Number(rating);
    if (!productId || !r || r < 1 || r > 5) {
      return res.status(400).json({ success: false, error: 'rating 1-5 required' });
    }

    // Enforce one review per user per product (schema has unique [userId, productId])
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating: r,
        title: title ?? null,
        comment: comment ?? null,
        verified: false // simple default
      }
    });

    return res.status(201).json({ success: true, data: review });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'already reviewed this product' });
    }
    return res.status(500).json({ success: false, error: 'Failed to create review', message: err.message });
  }
};

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete review
 *     description: Delete a review (users can only delete their own reviews)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         description: Unique identifier of the review to delete
 *         schema:
 *           type: string
 *           example: "review_123456789"
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "review deleted"
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Review not found or doesn't belong to user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// DELETE /api/reviews/:id
export const deleteReview = async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, error: 'unauthorized' });

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) {
      return res.status(404).json({ success: false, error: 'review not found' });
    }

    await prisma.review.delete({ where: { id } });
    return res.json({ success: true, message: 'review deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to delete review', message: err.message });
  }
};