import { Router } from 'express';
import { deleteReview, getProductReviews, createReview } from '../../controllers/reviewContoller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// GET /api/products/:productId/reviews - Get all reviews for a product
router.get('/products/:productId/reviews', getProductReviews);

// POST /api/products/:productId/reviews - Create a review for a product
router.post('/products/:productId/reviews', authenticate, createReview);

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', authenticate, deleteReview);

export default router;
