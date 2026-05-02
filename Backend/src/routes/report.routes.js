import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import {
  getTotalAppointmentsReport,
  getPeakHoursReport,
  getProviderUtilizationReport,
} from '../controllers/report.controller.js';

const router = Router();

router.use(authenticate, authorize('organiser', 'admin'));

/**
 * API 45: GET /api/reports/total-appointments
 * Get total appointments report
 */
router.get('/total-appointments', getTotalAppointmentsReport);

/**
 * API 46: GET /api/reports/peak-hours
 * Get peak hours report
 */
router.get('/peak-hours', getPeakHoursReport);

/**
 * API 47: GET /api/reports/provider-utilization
 * Get provider utilization report
 */
router.get('/provider-utilization', getProviderUtilizationReport);

export default router;
