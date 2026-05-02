import express from 'express';
import { createPayment, completePayment, getPayment, getPaymentByAppointment } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create', createPayment);
router.post('/:id/complete', completePayment);
router.get('/:id', getPayment);
router.get('/appointment/:appointmentId', getPaymentByAppointment);

export default router;
