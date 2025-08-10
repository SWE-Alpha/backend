import { Router } from 'express';
import { getAllProducts, getProductById, createProduct } from '../../controllers/productController';

const router = Router();

// GET /api/products - Get all products with filtering/pagination
router.get('/', getAllProducts);

// GET /api/products/:id - Get single product by ID
router.get('/:id', getProductById);

// POST /api/products - Create new product (Admin only)
router.post('/', createProduct);

export default router;