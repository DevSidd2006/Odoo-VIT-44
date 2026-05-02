import express from 'express';
import { bookAppointment, rescheduleAppointment, cancelAppointment, getAvailability } from '../controllers/appointments.controller.js';

const router = express.Router();

router.get('/availability', getAvailability);
router.post('/book', bookAppointment);
router.post('/:id/reschedule', rescheduleAppointment);
router.post('/:id/cancel', cancelAppointment);

export default router;
