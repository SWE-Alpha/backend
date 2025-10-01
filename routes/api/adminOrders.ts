import { Router } from 'express';
import { getAllOrdersAdmin } from '../../controllers/orderController';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All admin order routes require auth
router.use(authenticate);

// GET /api/admin/orders - all orders (admin only)
router.get('/', getAllOrdersAdmin);

export default router;
