import express from 'express';
import { getProfile, updateProfile, getProfileAppointments } from '../controllers/profile.controller.js';

const router = express.Router();

router.get('/', getProfile);
router.put('/', updateProfile);
router.get('/appointments', getProfileAppointments);

export default router;
