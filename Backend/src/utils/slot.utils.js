import { store } from '../store/index.js';

const DEFAULT_BOOKING_RULES = {
  maxBookingsPerSlot: 1,
  manualConfirmation: false,
  advancePayment: false,
  paymentFee: 0,
  paymentCapacityPercent: 100,
  slotCreationType: 'auto',
  cancellationCutoffHours: 0,
};

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
 * Converts a HH:MM time string into minutes since midnight.
 *
 * @param {string} time - Time string.
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
 * Formats minutes since midnight as HH:MM.
 *
 * @param {number} minutes - Minutes since midnight.
 * @returns {string} Formatted time.
 */
function formatMinutesToTime(minutes) {
  const safeMinutes = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Returns whether a YYYY-MM-DD string is valid.
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
 * Returns day name for a date string.
 *
 * @param {string} dateText - Date string.
 * @returns {string} Lowercase weekday name.
 */
function getDayName(dateText) {
  const date = new Date(`${dateText}T00:00:00`);
  return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

/**
 * Returns a booking rules record with defaults.
 *
 * @param {string} appointmentTypeId - Appointment type id.
 * @returns {object} Booking rules.
 */
function getBookingRules(appointmentTypeId) {
  const rules = store.bookingRules.find((item) => item.appointmentTypeId === appointmentTypeId);
  return {
    appointmentTypeId,
    ...DEFAULT_BOOKING_RULES,
    ...(rules || {}),
  };
}

/**
 * Finds an appointment type.
 *
 * @param {string} appointmentTypeId - Appointment type id.
 * @returns {object | undefined} Appointment type.
 */
function getAppointmentType(appointmentTypeId) {
  return store.appointmentTypes.find((item) => item.id === appointmentTypeId);
}

/**
 * Finds the schedule entry for a date.
 *
 * @param {object} appointmentType - Appointment type.
 * @param {string} date - Date string.
 * @returns {object | undefined} Schedule entry.
 */
function getScheduleForDate(appointmentType, date) {
  const schedule = store.schedules.find((item) => item.appointmentTypeId === appointmentType.id);
  if (!schedule) {
    return undefined;
  }

  if (schedule.scheduleType === 'weekly') {
    const dayName = getDayName(date);
    return schedule.slots.find((slot) => String(slot.day || '').toLowerCase() === dayName);
  }

  return schedule.slots.find((slot) => slot.date === date);
}

/**
 * Checks whether two date-time ranges overlap.
 *
 * @param {number} startA - Start A minutes.
 * @param {number} endA - End A minutes.
 * @param {number} startB - Start B minutes.
 * @param {number} endB - End B minutes.
 * @returns {boolean} Overlap result.
 */
function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Returns whether a booking overlaps a slot.
 *
 * @param {object} booking - Booking record.
 * @param {string} date - Date string.
 * @param {number} startMinutes - Slot start minutes.
 * @param {number} endMinutes - Slot end minutes.
 * @returns {boolean} Result.
 */
function bookingOverlapsSlot(booking, date, startMinutes, endMinutes) {
  if (booking.date !== date) {
    return false;
  }

  if (!['confirmed', 'pending'].includes(booking.status)) {
    return false;
  }

  const bookingStart = parseTimeToMinutes(booking.startTime);
  const bookingEnd = parseTimeToMinutes(booking.endTime);

  if (bookingStart === null || bookingEnd === null) {
    return false;
  }

  return overlaps(bookingStart, bookingEnd, startMinutes, endMinutes);
}

/**
 * Returns whether a manual slot overlaps a slot.
 *
 * @param {object} slot - Manual slot record.
 * @param {string} date - Date string.
 * @param {number} startMinutes - Slot start minutes.
 * @param {number} endMinutes - Slot end minutes.
 * @returns {boolean} Result.
 */
function manualSlotOverlaps(slot, date, startMinutes, endMinutes) {
  if (slot.date !== date) {
    return false;
  }

  const slotStart = parseTimeToMinutes(slot.startTime);
  const slotEnd = parseTimeToMinutes(slot.endTime);

  if (slotStart === null || slotEnd === null) {
    return false;
  }

  return overlaps(slotStart, slotEnd, startMinutes, endMinutes);
}

/**
 * Returns the set of resource ids already occupied for a slot.
 *
 * @param {string} appointmentTypeId - Appointment type id.
 * @param {string} date - Date string.
 * @param {number} startMinutes - Slot start minutes.
 * @param {number} endMinutes - Slot end minutes.
 * @returns {Set<string>} Occupied resource ids.
 */
function getOccupiedResourceIds(appointmentTypeId, date, startMinutes, endMinutes) {
  const occupied = new Set();

  for (const booking of store.bookings) {
    if (booking.appointmentTypeId !== appointmentTypeId) {
      continue;
    }

    if (!booking.resourceId) {
      continue;
    }

    if (bookingOverlapsSlot(booking, date, startMinutes, endMinutes)) {
      occupied.add(booking.resourceId);
    }
  }

  for (const slot of store.slots) {
    if (slot.appointmentTypeId !== appointmentTypeId || !slot.resourceId) {
      continue;
    }

    if (manualSlotOverlaps(slot, date, startMinutes, endMinutes)) {
      occupied.add(slot.resourceId);
    }
  }

  return occupied;
}

/**
 * Returns the set of user ids already occupied for a slot.
 *
 * @param {string} appointmentTypeId - Appointment type id.
 * @param {string} date - Date string.
 * @param {number} startMinutes - Slot start minutes.
 * @param {number} endMinutes - Slot end minutes.
 * @returns {Set<string>} Occupied user ids.
 */
function getOccupiedUserIds(appointmentTypeId, date, startMinutes, endMinutes) {
  const occupied = new Set();

  for (const booking of store.bookings) {
    if (booking.appointmentTypeId !== appointmentTypeId) {
      continue;
    }

    if (!booking.userId) {
      continue;
    }

    if (bookingOverlapsSlot(booking, date, startMinutes, endMinutes)) {
      occupied.add(booking.userId);
    }
  }

  for (const slot of store.slots) {
    if (slot.appointmentTypeId !== appointmentTypeId || !slot.userId) {
      continue;
    }

    if (manualSlotOverlaps(slot, date, startMinutes, endMinutes)) {
      occupied.add(slot.userId);
    }
  }

  return occupied;
}

/**
 * Returns resources available for a slot.
 *
 * @param {string} appointmentTypeId - Appointment type id.
 * @param {string} date - Date string.
 * @param {number} startMinutes - Slot start minutes.
 * @param {number} endMinutes - Slot end minutes.
 * @returns {Array<object>} Available resources.
 */
function getAvailableResourcesForSlot(appointmentTypeId, date, startMinutes, endMinutes) {
  const appointmentType = getAppointmentType(appointmentTypeId);
  if (!appointmentType) {
    return [];
  }

  const occupied = getOccupiedResourceIds(appointmentTypeId, date, startMinutes, endMinutes);
  return store.resources
    .filter((resource) => resource.organiserId === appointmentType.organiserId)
    .filter((resource) => !occupied.has(resource.id));
}

/**
 * Returns users available for a slot.
 *
 * @param {string} appointmentTypeId - Appointment type id.
 * @param {string} date - Date string.
 * @param {number} startMinutes - Slot start minutes.
 * @param {number} endMinutes - Slot end minutes.
 * @returns {Array<object>} Available users.
 */
function getAvailableUsersForSlot(appointmentTypeId, date, startMinutes, endMinutes) {
  const occupied = getOccupiedUserIds(appointmentTypeId, date, startMinutes, endMinutes);
  return store.users
    .filter((user) => user.role === 'organiser' && user.isActive === true)
    .filter((user) => !occupied.has(user.id));
}

/**
 * Generates available slots for an appointment type on a given date.
 *
 * @param {string} appointmentTypeId - Appointment type id.
 * @param {string} date - Date string in YYYY-MM-DD format.
 * @returns {Array<object>} Generated slots.
 */
export function generateAvailableSlots(appointmentTypeId, date) {
  const appointmentType = getAppointmentType(appointmentTypeId);
  if (!appointmentType || !isValidDateText(date)) {
    return [];
  }

  let scheduleSlot = getScheduleForDate(appointmentType, date);
  
  // If no schedule exists, create default full-day schedule (9AM-6PM)
  if (!scheduleSlot || !Array.isArray(scheduleSlot.windows)) {
    scheduleSlot = {
      windows: [
        { from: '09:00', to: '18:00' }
      ]
    };
  }

  const bookingRules = getBookingRules(appointmentTypeId);
  const today = startOfToday();
  const dateValue = new Date(`${date}T00:00:00`);

  if (dateValue < today) {
    return [];
  }

  const slots = [];
  const slotDuration = appointmentType.durationMinutes;

  for (const window of scheduleSlot.windows) {
    const windowStart = parseTimeToMinutes(window.from);
    const windowEnd = parseTimeToMinutes(window.to);

    if (windowStart === null || windowEnd === null || slotDuration <= 0) {
      continue;
    }

    for (let currentStart = windowStart; currentStart + slotDuration <= windowEnd; currentStart += slotDuration) {
      const currentEnd = currentStart + slotDuration;
      const bookedCount = store.bookings.filter((booking) =>
        bookingOverlapsSlot(booking, date, currentStart, currentEnd) &&
        booking.appointmentTypeId === appointmentTypeId &&
        ['confirmed', 'pending'].includes(booking.status),
      ).length;
      const availableCapacity = Math.max(0, bookingRules.maxBookingsPerSlot - bookedCount);
      const isAvailable = availableCapacity > 0;

      const generatedSlot = {
        startTime: formatMinutesToTime(currentStart),
        endTime: formatMinutesToTime(currentEnd),
        availableCapacity,
        isAvailable,
      };

      if (appointmentType.type === 'resource') {
        generatedSlot.resources = getAvailableResourcesForSlot(
          appointmentTypeId,
          date,
          currentStart,
          currentEnd,
        );
      }

      if (appointmentType.type === 'user' && appointmentType.assignment === 'by_visitor') {
        generatedSlot.users = getAvailableUsersForSlot(appointmentTypeId, date, currentStart, currentEnd);
      }

      slots.push(generatedSlot);
    }
  }

  return slots;
}

/**
 * Checks whether a manual slot overlaps existing manual slots for the same resource or user.
 *
 * @param {string} appointmentTypeId - Appointment type id.
 * @param {string} date - Date string.
 * @param {number} startMinutes - Slot start minutes.
 * @param {number} endMinutes - Slot end minutes.
 * @param {string | undefined} resourceId - Resource id.
 * @param {string | undefined} userId - User id.
 * @returns {boolean} Overlap result.
 */
export function hasManualSlotOverlap(appointmentTypeId, date, startMinutes, endMinutes, resourceId, userId) {
  for (const slot of store.slots) {
    if (slot.appointmentTypeId !== appointmentTypeId || slot.date !== date) {
      continue;
    }

    if (resourceId && slot.resourceId === resourceId) {
      const slotStart = parseTimeToMinutes(slot.startTime);
      const slotEnd = parseTimeToMinutes(slot.endTime);
      if (slotStart !== null && slotEnd !== null && overlaps(slotStart, slotEnd, startMinutes, endMinutes)) {
        return true;
      }
    }

    if (userId && slot.userId === userId) {
      const slotStart = parseTimeToMinutes(slot.startTime);
      const slotEnd = parseTimeToMinutes(slot.endTime);
      if (slotStart !== null && slotEnd !== null && overlaps(slotStart, slotEnd, startMinutes, endMinutes)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validates a manual slot payload.
 *
 * @param {object} payload - Slot payload.
 * @returns {{valid:boolean,message?:string}} Validation result.
 */
export function validateManualSlotPayload(payload) {
  const { date, startTime, endTime, capacity, resourceId, userId } = payload || {};

  if (!isValidDateText(date)) {
    return { valid: false, message: 'date must be in YYYY-MM-DD format' };
  }

  const dateValue = new Date(`${date}T00:00:00`);
  if (dateValue < startOfToday()) {
    return { valid: false, message: 'date cannot be in the past' };
  }

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null) {
    return { valid: false, message: 'startTime and endTime must be in HH:MM format' };
  }

  if (startMinutes >= endMinutes) {
    return { valid: false, message: 'startTime must be earlier than endTime' };
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    return { valid: false, message: 'capacity must be a positive integer' };
  }

  if (resourceId !== undefined && !store.resources.some((resource) => resource.id === resourceId)) {
    return { valid: false, message: 'resourceId is invalid' };
  }

  if (userId !== undefined && !store.users.some((user) => user.id === userId)) {
    return { valid: false, message: 'userId is invalid' };
  }

  return { valid: true };
}

/**
 * Returns time minutes for callers that need it.
 *
 * @param {string} time - Time string.
 * @returns {number | null} Minutes.
 */
export function toMinutes(time) {
  return parseTimeToMinutes(time);
}
