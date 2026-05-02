import { v4 as uuidv4 } from 'uuid';
import { store } from '../store/index.js';

const ALLOWED_TYPE_VALUES = ['user', 'resource'];
const ALLOWED_ASSIGNMENT_VALUES = ['auto', 'by_visitor'];
const UPDATABLE_FIELDS = new Set([
  'title',
  'durationMinutes',
  'location',
  'type',
  'assignment',
  'manageCapacity',
  'capacityLimit',
  'introMessage',
  'confirmMessage',
]);
const WEEKLY_DAYS = new Set([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
]);
const ALLOWED_SCHEDULE_TYPES = ['weekly', 'flexible'];

/**
 * Builds today's date at midnight for date-only comparisons.
 *
 * @returns {Date} Today at 00:00:00.000
 */
function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Checks whether user can access an appointment type.
 *
 * @param {object} user - Authenticated user token payload.
 * @param {object} appointmentType - Appointment type entity.
 * @returns {boolean} Access result.
 */
function canAccessAppointmentType(user, appointmentType) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'organiser') {
    return appointmentType.organiserId === user.userId;
  }

  if (user.role === 'customer') {
    return appointmentType.isPublished === true;
  }

  return false;
}

/**
 * Checks whether user can manage an appointment type.
 *
 * @param {object} user - Authenticated user token payload.
 * @param {object} appointmentType - Appointment type entity.
 * @returns {boolean} Access result.
 */
function canManageAppointmentType(user, appointmentType) {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'organiser') {
    return appointmentType.organiserId === user.userId;
  }

  return false;
}

/**
 * Returns appointment type by id.
 *
 * @param {string} id - Appointment type id.
 * @returns {object | undefined} Found appointment type.
 */
function findAppointmentType(id) {
  return store.appointmentTypes.find((item) => item.id === id);
}

/**
 * Converts a HH:MM time string into minutes since midnight.
 *
 * @param {string} time - Time string in HH:MM format.
 * @returns {number | null} Minutes or null when invalid.
 */
function parseTimeToMinutes(time) {
  if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const [hoursText, minutesText] = time.split(':');
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Returns whether a YYYY-MM-DD string is a valid calendar date.
 *
 * @param {string} dateText - Date string.
 * @returns {boolean} Validation result.
 */
function isValidDateText(dateText) {
  if (typeof dateText !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return false;
  }

  const parsedDate = new Date(`${dateText}T00:00:00`);
  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString().startsWith(dateText);
}

/**
 * Checks whether windows overlap within a group.
 *
 * @param {Array<{from:string,to:string}>} windows - Time windows.
 * @returns {{valid:boolean,message?:string}} Validation result.
 */
function validateWindows(windows) {
  if (!Array.isArray(windows) || windows.length === 0) {
    return { valid: false, message: 'windows must be a non-empty array' };
  }

  const normalizedWindows = windows.map((window) => {
    const start = parseTimeToMinutes(window?.from);
    const end = parseTimeToMinutes(window?.to);

    if (start === null || end === null) {
      return { valid: false, message: 'window times must use HH:MM format' };
    }

    if (start >= end) {
      return { valid: false, message: 'window from must be earlier than to' };
    }

    return {
      valid: true,
      start,
      end,
      from: window.from,
      to: window.to,
    };
  });

  const invalidWindow = normalizedWindows.find((window) => window.valid === false);
  if (invalidWindow) {
    return { valid: false, message: invalidWindow.message };
  }

  const sortedWindows = normalizedWindows
    .map((window) => ({ from: window.from, to: window.to, start: window.start, end: window.end }))
    .sort((left, right) => left.start - right.start || left.end - right.end);

  for (let index = 1; index < sortedWindows.length; index += 1) {
    if (sortedWindows[index].start < sortedWindows[index - 1].end) {
      return { valid: false, message: 'windows must not overlap within the same day' };
    }
  }

  return { valid: true, windows: sortedWindows.map(({ from, to }) => ({ from, to })) };
}

/**
 * Normalizes and validates schedule slots.
 *
 * @param {string} scheduleType - weekly or flexible.
 * @param {Array<object>} slots - Schedule slots payload.
 * @returns {{valid:boolean,message?:string,slots?:Array<object>}} Validation result.
 */
function validateScheduleSlots(scheduleType, slots) {
  if (!ALLOWED_SCHEDULE_TYPES.includes(scheduleType)) {
    return {
      valid: false,
      message: 'scheduleType must be weekly or flexible',
    };
  }

  if (!Array.isArray(slots) || slots.length === 0) {
    return {
      valid: false,
      message: 'slots must be a non-empty array',
    };
  }

  const groupedWindows = new Map();
  const normalizedSlots = [];

  for (const slot of slots) {
    if (!slot || typeof slot !== 'object') {
      return { valid: false, message: 'Each slot must be an object' };
    }

    const groupKey = scheduleType === 'weekly' ? String(slot.day || '').toLowerCase() : slot.date;

    if (scheduleType === 'weekly') {
      if (!WEEKLY_DAYS.has(groupKey)) {
        return { valid: false, message: 'day must be a valid weekday name' };
      }
    } else if (!isValidDateText(groupKey)) {
      return { valid: false, message: 'date must be in YYYY-MM-DD format' };
    }

    const windowValidation = validateWindows(slot.windows);
    if (!windowValidation.valid) {
      return { valid: false, message: windowValidation.message };
    }

    const existingWindows = groupedWindows.get(groupKey) || [];
    groupedWindows.set(groupKey, [...existingWindows, ...windowValidation.windows]);

    normalizedSlots.push(
      scheduleType === 'weekly'
        ? { day: groupKey, windows: windowValidation.windows }
        : { date: groupKey, windows: windowValidation.windows },
    );
  }

  for (const [groupKey, windows] of groupedWindows.entries()) {
    const orderedWindows = [...windows].sort(
      (left, right) => parseTimeToMinutes(left.from) - parseTimeToMinutes(right.from),
    );

    for (let index = 1; index < orderedWindows.length; index += 1) {
      const previousEnd = parseTimeToMinutes(orderedWindows[index - 1].to);
      const currentStart = parseTimeToMinutes(orderedWindows[index].from);

      if (currentStart < previousEnd) {
        return {
          valid: false,
          message: `windows must not overlap within ${groupKey}`,
        };
      }
    }
  }

  return { valid: true, slots: normalizedSlots };
}

/**
 * Creates a new appointment type.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function createAppointmentType(req, res) {
  try {
    const {
      title,
      durationMinutes,
      location,
      type,
      assignment,
      manageCapacity,
      capacityLimit,
      introMessage,
      confirmMessage,
    } = req.body;

    if (typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'title is required',
      });
    }

    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'durationMinutes must be a positive integer',
      });
    }

    if (!ALLOWED_TYPE_VALUES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type must be user or resource',
      });
    }

    if (!ALLOWED_ASSIGNMENT_VALUES.includes(assignment)) {
      return res.status(400).json({
        success: false,
        message: 'assignment must be auto or by_visitor',
      });
    }

    if (manageCapacity !== undefined && typeof manageCapacity !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'manageCapacity must be a boolean',
      });
    }

    if (capacityLimit !== undefined && (!Number.isInteger(capacityLimit) || capacityLimit <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'capacityLimit must be a positive integer',
      });
    }

    const appointmentType = {
      id: uuidv4(),
      organiserId: req.user.userId,
      title: title.trim(),
      durationMinutes,
      location: typeof location === 'string' && location.trim().length > 0 ? location.trim() : null,
      type,
      assignment,
      manageCapacity: manageCapacity ?? false,
      capacityLimit: capacityLimit ?? 1,
      isPublished: false,
      shareToken: uuidv4(),
      introMessage: typeof introMessage === 'string' ? introMessage : '',
      confirmMessage: typeof confirmMessage === 'string' ? confirmMessage : '',
      createdAt: new Date(),
    };

    store.appointmentTypes.push(appointmentType);

    return res.status(201).json({
      success: true,
      appointmentType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Returns appointment types by role visibility with upcoming booking counts.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function listAppointmentTypes(req, res) {
  try {
    const today = startOfToday();

    let appointmentTypes;
    if (req.user.role === 'admin') {
      appointmentTypes = [...store.appointmentTypes];
    } else if (req.user.role === 'organiser') {
      appointmentTypes = store.appointmentTypes.filter(
        (item) => item.organiserId === req.user.userId,
      );
    } else {
      appointmentTypes = store.appointmentTypes.filter((item) => item.isPublished === true);
    }

    const appointmentTypesWithCounts = appointmentTypes.map((appointmentType) => {
      const upcomingBookingsCount = store.bookings.filter((booking) => {
        if (booking.appointmentTypeId !== appointmentType.id) {
          return false;
        }

        const bookingDate = new Date(booking.date);
        return bookingDate >= today;
      }).length;

      return {
        ...appointmentType,
        upcomingBookingsCount,
      };
    });

    return res.status(200).json({
      success: true,
      total: appointmentTypesWithCounts.length,
      appointmentTypes: appointmentTypesWithCounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Returns one appointment type if user has access.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function getAppointmentTypeById(req, res) {
  try {
    const appointmentType = findAppointmentType(req.params.id);

    if (!appointmentType || !canAccessAppointmentType(req.user, appointmentType)) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    return res.status(200).json({
      success: true,
      appointmentType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Partially updates an appointment type.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function updateAppointmentType(req, res) {
  try {
    const appointmentType = findAppointmentType(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    if (!canManageAppointmentType(req.user, appointmentType)) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    const entries = Object.entries(req.body || {});
    for (const [key] of entries) {
      if (!UPDATABLE_FIELDS.has(key)) {
        return res.status(400).json({
          success: false,
          message: `Field ${key} cannot be updated`,
        });
      }
    }

    const {
      title,
      durationMinutes,
      location,
      type,
      assignment,
      manageCapacity,
      capacityLimit,
      introMessage,
      confirmMessage,
    } = req.body;

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'title must be a non-empty string',
      });
    }

    if (durationMinutes !== undefined && (!Number.isInteger(durationMinutes) || durationMinutes <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'durationMinutes must be a positive integer',
      });
    }

    if (type !== undefined && !ALLOWED_TYPE_VALUES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'type must be user or resource',
      });
    }

    if (assignment !== undefined && !ALLOWED_ASSIGNMENT_VALUES.includes(assignment)) {
      return res.status(400).json({
        success: false,
        message: 'assignment must be auto or by_visitor',
      });
    }

    if (manageCapacity !== undefined && typeof manageCapacity !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'manageCapacity must be a boolean',
      });
    }

    if (capacityLimit !== undefined && (!Number.isInteger(capacityLimit) || capacityLimit <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'capacityLimit must be a positive integer',
      });
    }

    if (title !== undefined) {
      appointmentType.title = title.trim();
    }
    if (durationMinutes !== undefined) {
      appointmentType.durationMinutes = durationMinutes;
    }
    if (location !== undefined) {
      appointmentType.location =
        typeof location === 'string' && location.trim().length > 0 ? location.trim() : null;
    }
    if (type !== undefined) {
      appointmentType.type = type;
    }
    if (assignment !== undefined) {
      appointmentType.assignment = assignment;
    }
    if (manageCapacity !== undefined) {
      appointmentType.manageCapacity = manageCapacity;
    }
    if (capacityLimit !== undefined) {
      appointmentType.capacityLimit = capacityLimit;
    }
    if (introMessage !== undefined) {
      appointmentType.introMessage = typeof introMessage === 'string' ? introMessage : '';
    }
    if (confirmMessage !== undefined) {
      appointmentType.confirmMessage = typeof confirmMessage === 'string' ? confirmMessage : '';
    }

    return res.status(200).json({
      success: true,
      appointmentType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Deletes an appointment type after dependency checks.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function deleteAppointmentType(req, res) {
  try {
    const appointmentType = findAppointmentType(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    if (!canManageAppointmentType(req.user, appointmentType)) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    const today = startOfToday();
    const hasActiveBookings = store.bookings.some((booking) => {
      if (booking.appointmentTypeId !== appointmentType.id) {
        return false;
      }

      const bookingDate = new Date(booking.date);
      return bookingDate >= today && booking.status === 'confirmed';
    });

    if (hasActiveBookings) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete: active bookings exist',
      });
    }

    store.appointmentTypes = store.appointmentTypes.filter((item) => item.id !== appointmentType.id);
    store.schedules = store.schedules.filter((item) => item.appointmentTypeId !== appointmentType.id);
    store.questions = store.questions.filter((item) => item.appointmentTypeId !== appointmentType.id);
    store.bookingRules = store.bookingRules.filter(
      (item) => item.appointmentTypeId !== appointmentType.id,
    );
    store.slots = store.slots.filter((item) => item.appointmentTypeId !== appointmentType.id);

    return res.status(200).json({
      success: true,
      message: 'Appointment type deleted',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Publishes an appointment type after schedule existence check.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function publishAppointmentType(req, res) {
  try {
    const appointmentType = findAppointmentType(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    if (!canManageAppointmentType(req.user, appointmentType)) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    const hasSchedule = store.schedules.some(
      (schedule) => schedule.appointmentTypeId === appointmentType.id,
    );

    if (!hasSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish: at least one schedule is required',
      });
    }

    appointmentType.isPublished = true;

    return res.status(200).json({
      success: true,
      message: 'Published',
      appointmentType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Unpublishes an appointment type.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function unpublishAppointmentType(req, res) {
  try {
    const appointmentType = findAppointmentType(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    if (!canManageAppointmentType(req.user, appointmentType)) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    appointmentType.isPublished = false;

    return res.status(200).json({
      success: true,
      message: 'Unpublished',
      appointmentType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Returns share link data for an appointment type.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function getAppointmentTypeShareLink(req, res) {
  try {
    const appointmentType = findAppointmentType(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    if (!canManageAppointmentType(req.user, appointmentType)) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    return res.status(200).json({
      success: true,
      shareLink: `/book/${appointmentType.shareToken}`,
      shareToken: appointmentType.shareToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Returns appointment type preview payload for organiser/admin.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function previewAppointmentType(req, res) {
  try {
    const appointmentType = findAppointmentType(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    if (!canManageAppointmentType(req.user, appointmentType)) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    const schedule = store.schedules.filter((item) => item.appointmentTypeId === appointmentType.id);
    const questions = store.questions.filter((item) => item.appointmentTypeId === appointmentType.id);

    const preview = {
      title: appointmentType.title,
      durationMinutes: appointmentType.durationMinutes,
      location: appointmentType.location,
      introMessage: appointmentType.introMessage,
      confirmMessage: appointmentType.confirmMessage,
      type: appointmentType.type,
      assignment: appointmentType.assignment,
      manageCapacity: appointmentType.manageCapacity,
      capacityLimit: appointmentType.capacityLimit,
      schedule,
      questions,
    };

    return res.status(200).json({
      success: true,
      preview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Creates or replaces a schedule for an appointment type.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function upsertAppointmentTypeSchedule(req, res) {
  try {
    const appointmentType = findAppointmentType(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    if (!canManageAppointmentType(req.user, appointmentType)) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    const { scheduleType, slots } = req.body;
    const validation = validateScheduleSlots(scheduleType, slots);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const schedule = {
      appointmentTypeId: appointmentType.id,
      scheduleType,
      slots: validation.slots,
    };

    store.schedules = store.schedules.filter(
      (item) => item.appointmentTypeId !== appointmentType.id,
    );
    store.schedules.push(schedule);

    return res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Returns a schedule for an appointment type.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function getAppointmentTypeSchedule(req, res) {
  try {
    const appointmentType = findAppointmentType(req.params.id);

    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    const schedule = store.schedules.find((item) => item.appointmentTypeId === appointmentType.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    return res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}
