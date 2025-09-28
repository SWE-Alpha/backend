import { Router } from "express";
import { authenticate } from '../../middleware/auth';
import { getUsers, getUserById, updateUser, deleteUser } from "../../controllers/userController";
const router = Router();
router.use(authenticate);

// Protect with auth + only admins can manage users
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
