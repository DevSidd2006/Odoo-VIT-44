import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  getDashboardStats,
} from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);

export default router;
