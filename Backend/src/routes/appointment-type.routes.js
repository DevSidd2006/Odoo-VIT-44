import { Router } from 'express';
import {
  createAppointmentType,
  deleteAppointmentType,
  getAppointmentTypeSchedule,
  getAppointmentTypeById,
  getAppointmentTypeShareLink,
  listAppointmentTypes,
  previewAppointmentType,
  publishAppointmentType,
  unpublishAppointmentType,
  upsertAppointmentTypeSchedule,
  updateAppointmentType,
} from '../controllers/appointment-type.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', authorize('organiser', 'admin'), createAppointmentType);
router.get('/', listAppointmentTypes);
router.get('/:id', getAppointmentTypeById);
router.put('/:id', authorize('organiser', 'admin'), updateAppointmentType);
router.put('/:id/schedule', authorize('organiser', 'admin'), upsertAppointmentTypeSchedule);
router.get('/:id/schedule', getAppointmentTypeSchedule);
router.delete('/:id', authorize('organiser', 'admin'), deleteAppointmentType);
router.post('/:id/publish', authorize('organiser', 'admin'), publishAppointmentType);
router.post('/:id/unpublish', authorize('organiser', 'admin'), unpublishAppointmentType);
router.get('/:id/share-link', authorize('organiser', 'admin'), getAppointmentTypeShareLink);
router.get('/:id/preview', authorize('organiser', 'admin'), previewAppointmentType);

export default router;
