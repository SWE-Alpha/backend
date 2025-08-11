import { Request, Response } from 'express';
const { prisma } = require('../utils/db');

type AuthedRequest = Request & { user?: { id: string } };

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