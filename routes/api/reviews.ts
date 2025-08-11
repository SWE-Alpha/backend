import { Router } from 'express';
import { deleteReview } from '../../controllers/reviewContoller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.delete('/:id', authenticate, deleteReview);

export default router;
