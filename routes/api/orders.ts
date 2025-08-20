import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById } from '../../controllers/orderController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All order routes require auth
router.use(authenticate);

// POST /api/orders - create from cart
router.post('/', createOrder);

// GET /api/orders - my orders
router.get('/', getMyOrders);

// GET /api/orders/:id - order by id
router.get('/:id', getOrderById);

export default router;
