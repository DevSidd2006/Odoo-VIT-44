import { Router } from 'express';
import {
  getMyAppointments,
  getMyProfile,
  updateMyProfile,
} from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.get('/me/appointments', getMyAppointments);

export default router;
