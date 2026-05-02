import { Router } from 'express';
import {
  createAppointmentType,
  createAppointmentTypeQuestion,
  deleteAppointmentType,
  deleteAppointmentTypeQuestion,
  getBookingRules,
  getAppointmentTypeSchedule,
  getAppointmentTypeById,
  getAppointmentTypeShareLink,
  listAppointmentTypeQuestions,
  listAppointmentTypes,
  previewAppointmentType,
  publishAppointmentType,
  updateAppointmentTypeQuestion,
  unpublishAppointmentType,
  upsertBookingRules,
  upsertAppointmentTypeSchedule,
  updateAppointmentType,
} from '../controllers/appointment-type.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';
import {
  generateAvailableSlots,
  hasManualSlotOverlap,
  toMinutes,
  validateManualSlotPayload,
} from '../utils/slot.utils.js';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../store/index.js';

const router = Router();

function findAppointmentTypeById(id) {
  return store.appointmentTypes.find((item) => item.id === id);
}

function getBookingRulesForAppointmentType(appointmentTypeId) {
  const rules = store.bookingRules.find((item) => item.appointmentTypeId === appointmentTypeId);

  return {
    maxBookingsPerSlot: 1,
    manualConfirmation: false,
    advancePayment: false,
    paymentFee: 0,
    paymentCapacityPercent: 100,
    slotCreationType: 'auto',
    cancellationCutoffHours: 0,
    ...(rules || {}),
  };
}

function isValidDateText(dateText) {
  if (typeof dateText !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return false;
  }

  const parsedDate = new Date(`${dateText}T00:00:00`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(dateText);
}

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

router.use(authenticate);

router.post('/', authorize('organiser', 'admin'), createAppointmentType);
router.get('/', listAppointmentTypes);
router.get('/:id', getAppointmentTypeById);
router.put('/:id', authorize('organiser', 'admin'), updateAppointmentType);
router.put('/:id/schedule', authorize('organiser', 'admin'), upsertAppointmentTypeSchedule);
router.get('/:id/schedule', getAppointmentTypeSchedule);
router.put('/:id/rules', authorize('organiser', 'admin'), upsertBookingRules);
router.get('/:id/rules', getBookingRules);
router.get('/:id/slots', authenticate, (req, res) => {
  try {
    const appointmentType = findAppointmentTypeById(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    const { date } = req.query;
    if (!isValidDateText(date)) {
      return res.status(400).json({
        success: false,
        message: 'date must be in YYYY-MM-DD format',
      });
    }

    const requestedDate = new Date(`${date}T00:00:00`);
    if (requestedDate < getStartOfToday()) {
      return res.status(400).json({
        success: false,
        message: 'date cannot be in the past',
      });
    }

    const baseSlots = generateAvailableSlots(appointmentType.id, date);
    const bookingRules = getBookingRulesForAppointmentType(appointmentType.id);

    const slots = baseSlots.map((slot) => {
      const startMinutes = toMinutes(slot.startTime);
      const endMinutes = toMinutes(slot.endTime);

      const enrichedSlot = {
        ...slot,
      };

      if (appointmentType.type === 'resource') {
        enrichedSlot.resources = slot.resources || [];
      }

      if (appointmentType.type === 'user' && appointmentType.assignment === 'by_visitor') {
        enrichedSlot.users = slot.users || [];
      }

      // Keep the generated capacity aligned with booking rules even if the engine returns no slots.
      if (startMinutes === null || endMinutes === null) {
        enrichedSlot.availableCapacity = bookingRules.maxBookingsPerSlot;
      }

      return enrichedSlot;
    });

    return res.status(200).json({
      success: true,
      date,
      slots,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});
router.post('/:id/slots', authorize('organiser', 'admin'), (req, res) => {
  try {
    const appointmentType = findAppointmentTypeById(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    const bookingRules = getBookingRulesForAppointmentType(appointmentType.id);
    if (bookingRules.slotCreationType !== 'manual') {
      return res.status(400).json({
        success: false,
        message: 'Manual slots are only allowed when slotCreationType is manual',
      });
    }

    const validation = validateManualSlotPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { date, startTime, endTime, capacity, resourceId, userId } = req.body;
    const startMinutes = toMinutes(startTime);
    const endMinutes = toMinutes(endTime);

    if (
      hasManualSlotOverlap(
        appointmentType.id,
        date,
        startMinutes,
        endMinutes,
        resourceId,
        userId,
      )
    ) {
      return res.status(409).json({
        success: false,
        message: 'Manual slot overlaps an existing slot',
      });
    }

    const slot = {
      id: uuidv4(),
      appointmentTypeId: appointmentType.id,
      date,
      startTime,
      endTime,
      capacity,
      bookedCount: 0,
      ...(resourceId !== undefined ? { resourceId } : {}),
      ...(userId !== undefined ? { userId } : {}),
      createdAt: new Date(),
    };

    store.slots.push(slot);

    return res.status(201).json({
      success: true,
      slot,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
});
router.post('/:id/questions', authorize('organiser', 'admin'), createAppointmentTypeQuestion);
router.get('/:id/questions', listAppointmentTypeQuestions);
router.put('/:id/questions/:qid', authorize('organiser', 'admin'), updateAppointmentTypeQuestion);
router.delete('/:id/questions/:qid', authorize('organiser', 'admin'), deleteAppointmentTypeQuestion);
router.delete('/:id', authorize('organiser', 'admin'), deleteAppointmentType);
router.post('/:id/publish', authorize('organiser', 'admin'), publishAppointmentType);
router.post('/:id/unpublish', authorize('organiser', 'admin'), unpublishAppointmentType);
router.get('/:id/share-link', authorize('organiser', 'admin'), getAppointmentTypeShareLink);
router.get('/:id/preview', authorize('organiser', 'admin'), previewAppointmentType);

export default router;
