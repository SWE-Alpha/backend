import { Router } from 'express';
import { getAllProducts, getProductById, createProduct } from '../../controllers/productController';
import { getProductReviews, createReview } from '../../controllers/reviewContoller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// GET /api/products - Get all products with filtering/pagination
router.get('/', getAllProducts);

// GET /api/products/:id - Get single product by ID
router.get('/:id', getProductById);

// POST /api/products - Create new product (Admin only)
router.post('/', createProduct);

// Product Reviews
// GET /api/products/:productId/reviews - public
router.get('/:productId/reviews', getProductReviews);
// POST /api/products/:productId/reviews - auth required
router.post('/:productId/reviews', authenticate, createReview);

export default router;