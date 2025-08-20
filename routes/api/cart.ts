import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart
} from '../../controllers/cartController';
import { authenticate } from '../../middleware/auth'; // Uncomment when auth middleware is ready

const router = Router();
router.use(authenticate); // Uncomment when auth middleware is ready

// All cart routes require authentication
// router.use(authenticate); // Uncomment when auth middleware is ready

router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:itemId', updateItem);
router.delete('/items/:itemId', removeItem);
router.delete('/', clearCart);

export default router;
