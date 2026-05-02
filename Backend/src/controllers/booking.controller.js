import { v4 as uuidv4 } from 'uuid';
import { store } from '../store/index.js';
import { generateAvailableSlots, toMinutes } from '../utils/slot.utils.js';

// ============ HELPER FUNCTIONS ============

/**
 * Check if user can access a booking
 * Customer: only own bookings
 * Organiser: bookings for their appointmentTypes
 * Admin: all bookings
 */
function canAccessBooking(user, booking) {
  if (user.role === 'admin') return true;
  if (user.role === 'customer') return user.id === booking.customerId;
  if (user.role === 'organiser') {
    const appointmentType = store.appointmentTypes.find(
      (at) => at.id === booking.appointmentTypeId
    );
    return appointmentType && appointmentType.organiserId === user.id;
  }
  return false;
}

/**
 * Find resource/user with fewest bookings on a specific date
 */
function findAutoAssignTarget(candidates, type, date) {
  if (!candidates || candidates.length === 0) return null;

  const bookingCountMap = new Map();
  candidates.forEach((id) => bookingCountMap.set(id, 0));

  store.bookings.forEach((booking) => {
    if (booking.date === date && booking.status !== 'cancelled') {
      if (type === 'resource' && booking.resourceId) {
        const count = bookingCountMap.get(booking.resourceId) || 0;
        bookingCountMap.set(booking.resourceId, count + 1);
      } else if (type === 'user' && booking.userId) {
        const count = bookingCountMap.get(booking.userId) || 0;
        bookingCountMap.set(booking.userId, count + 1);
      }
    }
  });

  let targetId = null;
  let minCount = Infinity;

  candidates.forEach((id) => {
    const count = bookingCountMap.get(id) || 0;
    if (count < minCount) {
      minCount = count;
      targetId = id;
    }
  });

  return targetId;
}

/**
 * Validate all mandatory questions have answers
 */
function validateMandatoryQuestions(appointmentTypeId, answers) {
  const questions = store.questions.filter(
    (q) => q.appointmentTypeId === appointmentTypeId && q.mandatory
  );

  for (const question of questions) {
    const answer = answers.find((a) => a.questionId === question.id);
    if (!answer || !answer.answer) {
      return {
        valid: false,
        message: `Mandatory question "${question.question}" not answered`,
      };
    }
  }

  return { valid: true };
}

/**
 * Determine booking status based on manualConfirmation flag
 */
function determineBookingStatus(manualConfirmation) {
  return manualConfirmation === true ? 'pending' : 'confirmed';
}

/**
 * Determine payment status based on advancePayment flag
 */
function determinePaymentStatus(advancePayment) {
  return advancePayment === false ? 'not_required' : 'pending_payment';
}

/**
 * Check if booking is within cancellation cutoff window
 */
function isWithinCancellationCutoff(booking, cutoffHours) {
  const bookingTime = new Date(`${booking.date}T${booking.startTime}`);
  const now = new Date();
  const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);
  return hoursUntilBooking < cutoffHours;
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function startOfToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get safe booking data (without sensitive fields)
 */
function toSafeBooking(booking) {
  return {
    id: booking.id,
    appointmentTypeId: booking.appointmentTypeId,
    customerId: booking.customerId,
    resourceId: booking.resourceId,
    userId: booking.userId,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    capacity: booking.capacity,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    answers: booking.answers,
    createdAt: booking.createdAt,
  };
}

// ============ API HANDLERS ============

/**
 * API 37: POST /api/bookings
 * Create a new booking with atomic availability check
 */
async function createBooking(req, res) {
  try {
    const { appointmentTypeId, date, startTime, endTime, resourceId, userId, capacity, answers } = req.body;

    // Validate required fields
    if (!appointmentTypeId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: appointmentTypeId, date, startTime, endTime',
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'answers must be an array',
      });
    }

    // Load appointmentType
    const appointmentType = store.appointmentTypes.find(
      (at) => at.id === appointmentTypeId
    );
    if (!appointmentType) {
      return res.status(404).json({
        success: false,
        message: 'Appointment type not found',
      });
    }

    // Verify published
    if (!appointmentType.isPublished) {
      return res.status(409).json({
        success: false,
        message: 'Appointment type is not published',
      });
    }

    // Get booking rules (with defaults)
    let bookingRules = store.bookingRules.find(
      (br) => br.appointmentTypeId === appointmentTypeId
    );
    if (!bookingRules) {
      bookingRules = {
        maxBookingsPerSlot: 1,
        manualConfirmation: false,
        advancePayment: false,
        slotCreationType: 'auto',
        cancellationCutoffHours: 24,
      };
    }

    // Validate mandatory questions
    const qValidation = validateMandatoryQuestions(appointmentTypeId, answers);
    if (!qValidation.valid) {
      return res.status(400).json({
        success: false,
        message: qValidation.message,
      });
    }

    // ATOMIC AVAILABILITY CHECK: Re-validate slot
    const availableSlots = generateAvailableSlots(appointmentTypeId, date);
    const slot = availableSlots.find(
      (s) => s.startTime === startTime && s.endTime === endTime
    );

    if (!slot) {
      return res.status(409).json({
        success: false,
        message: 'Requested time slot does not exist',
      });
    }

    if (!slot.isAvailable || slot.availableCapacity <= 0) {
      return res.status(409).json({
        success: false,
        message: 'Slot fully booked',
      });
    }

    // Validate resource/user assignment if by_visitor
    if (appointmentType.assignment === 'by_visitor') {
      if (appointmentType.type === 'resource' && !resourceId) {
        return res.status(400).json({
          success: false,
          message: 'resourceId required for resource-type appointment with by_visitor assignment',
        });
      }
      if (appointmentType.type === 'user' && !userId) {
        return res.status(400).json({
          success: false,
          message: 'userId required for user-type appointment with by_visitor assignment',
        });
      }
      // Validate resource/user exists
      if (appointmentType.type === 'resource' && resourceId) {
        const resource = store.resources.find((r) => r.id === resourceId);
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Resource not found',
          });
        }
      }
      if (appointmentType.type === 'user' && userId) {
        const user = store.users.find((u) => u.id === userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }
      }
    }

    // Auto-assign if needed
    let finalResourceId = resourceId;
    let finalUserId = userId;

    if (appointmentType.assignment === 'auto') {
      if (appointmentType.type === 'resource') {
        // Find available resources from slot or all
        const availableResourceIds = slot.resources || [];
        finalResourceId = findAutoAssignTarget(availableResourceIds, 'resource', date);
      } else if (appointmentType.type === 'user') {
        // Find available users from slot or all
        const availableUserIds = slot.users || [];
        finalUserId = findAutoAssignTarget(availableUserIds, 'user', date);
      }
    }

    // Determine status and payment
    const status = determineBookingStatus(bookingRules.manualConfirmation);
    const paymentStatus = determinePaymentStatus(bookingRules.advancePayment);

    // Create booking
    const booking = {
      id: uuidv4(),
      appointmentTypeId,
      customerId: req.user.id,
      resourceId: finalResourceId || null,
      userId: finalUserId || null,
      date,
      startTime,
      endTime,
      capacity: capacity || 1,
      status,
      paymentStatus,
      answers,
      createdAt: new Date(),
    };

    store.bookings.push(booking);

    return res.status(201).json({
      success: true,
      booking: toSafeBooking(booking),
      confirmationMessage: appointmentType.confirmMessage || 'Booking confirmed',
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating booking',
    });
  }
}

/**
 * API 38: GET /api/bookings
 * List bookings (organiser: own types, admin: all)
 */
function listBookings(req, res) {
  try {
    const { appointmentTypeId, status, date, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    let bookings = [...store.bookings];

    // Filter by role
    if (req.user.role === 'organiser') {
      const organisersTypes = store.appointmentTypes
        .filter((at) => at.organiserId === req.user.id)
        .map((at) => at.id);
      bookings = bookings.filter((b) => organisersTypes.includes(b.appointmentTypeId));
    }

    // Apply filters
    if (appointmentTypeId) {
      bookings = bookings.filter((b) => b.appointmentTypeId === appointmentTypeId);
    }
    if (status) {
      bookings = bookings.filter((b) => b.status === status);
    }
    if (date) {
      bookings = bookings.filter((b) => b.date === date);
    }

    // Paginate
    const total = bookings.length;
    const startIdx = (pageNum - 1) * limitNum;
    const paginatedBookings = bookings.slice(startIdx, startIdx + limitNum);

    // Enrich with appointment title, customer name
    const enriched = paginatedBookings.map((booking) => {
      const appointmentType = store.appointmentTypes.find(
        (at) => at.id === booking.appointmentTypeId
      );
      const customer = store.users.find((u) => u.id === booking.customerId);
      const resource = booking.resourceId
        ? store.resources.find((r) => r.id === booking.resourceId)
        : null;
      const user = booking.userId
        ? store.users.find((u) => u.id === booking.userId)
        : null;

      return {
        id: booking.id,
        appointmentTitle: appointmentType?.title || 'N/A',
        customerName: customer?.fullName || 'N/A',
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        resourceName: resource?.name || null,
        userName: user?.fullName || null,
      };
    });

    return res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      bookings: enriched,
    });
  } catch (error) {
    console.error('Error listing bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error listing bookings',
    });
  }
}

/**
 * API 39: GET /api/bookings/my
 * Get customer's bookings with status filter
 */
function getMyBookings(req, res) {
  try {
    const { status } = req.query; // upcoming, past, all
    const today = startOfToday();

    let bookings = store.bookings.filter((b) => b.customerId === req.user.id);

    // Filter by status
    if (status === 'upcoming') {
      bookings = bookings.filter((b) => b.date >= today && b.status !== 'cancelled');
    } else if (status === 'past') {
      bookings = bookings.filter((b) => b.date < today);
    }
    // else 'all' - no filter

    // Enrich with appointmentType info
    const enriched = bookings.map((booking) => {
      const appointmentType = store.appointmentTypes.find(
        (at) => at.id === booking.appointmentTypeId
      );
      return {
        ...toSafeBooking(booking),
        appointmentTitle: appointmentType?.title || 'N/A',
        location: appointmentType?.location || 'N/A',
      };
    });

    return res.json({
      success: true,
      bookings: enriched,
    });
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bookings',
    });
  }
}

/**
 * API 40: GET /api/bookings/:id
 * Get booking detail with access control
 */
function getBookingById(req, res) {
  try {
    const { id } = req.params;
    const booking = store.bookings.find((b) => b.id === id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check access
    if (!canAccessBooking(req.user, booking)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Enrich with related info
    const appointmentType = store.appointmentTypes.find(
      (at) => at.id === booking.appointmentTypeId
    );
    const customer = store.users.find((u) => u.id === booking.customerId);
    const resource = booking.resourceId
      ? store.resources.find((r) => r.id === booking.resourceId)
      : null;
    const user = booking.userId
      ? store.users.find((u) => u.id === booking.userId)
      : null;

    const enriched = {
      ...toSafeBooking(booking),
      appointmentType: appointmentType
        ? {
            id: appointmentType.id,
            title: appointmentType.title,
            durationMinutes: appointmentType.durationMinutes,
            location: appointmentType.location,
            type: appointmentType.type,
          }
        : null,
      customer: customer ? { id: customer.id, fullName: customer.fullName } : null,
      resource: resource ? { id: resource.id, name: resource.name } : null,
      assignedUser: user ? { id: user.id, fullName: user.fullName } : null,
    };

    return res.json({
      success: true,
      booking: enriched,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching booking',
    });
  }
}

/**
 * API 41: PUT /api/bookings/:id/reschedule
 * Reschedule booking with cutoff check
 */
function rescheduleBooking(req, res) {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: date, startTime, endTime',
      });
    }

    const booking = store.bookings.find((b) => b.id === id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Customer can only reschedule their own
    if (booking.customerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Cannot reschedule cancelled bookings
    if (booking.status === 'cancelled') {
      return res.status(409).json({
        success: false,
        message: 'Cannot reschedule a cancelled booking',
      });
    }

    // Load booking rules and check cutoff
    let bookingRules = store.bookingRules.find(
      (br) => br.appointmentTypeId === booking.appointmentTypeId
    );
    const cutoffHours = bookingRules?.cancellationCutoffHours || 24;

    if (isWithinCancellationCutoff(booking, cutoffHours)) {
      return res.status(409).json({
        success: false,
        message: `Cannot reschedule within ${cutoffHours} hours of booking`,
      });
    }

    // Validate new slot availability
    const availableSlots = generateAvailableSlots(booking.appointmentTypeId, date);
    const slot = availableSlots.find(
      (s) => s.startTime === startTime && s.endTime === endTime
    );

    if (!slot) {
      return res.status(409).json({
        success: false,
        message: 'Requested time slot does not exist',
      });
    }

    if (!slot.isAvailable || slot.availableCapacity <= 0) {
      return res.status(409).json({
        success: false,
        message: 'Slot fully booked',
      });
    }

    // Update booking
    booking.date = date;
    booking.startTime = startTime;
    booking.endTime = endTime;

    return res.json({
      success: true,
      booking: toSafeBooking(booking),
    });
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error rescheduling booking',
    });
  }
}

/**
 * API 42: PUT /api/bookings/:id/cancel
 * Cancel booking with role-based cutoff check
 */
function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    const booking = store.bookings.find((b) => b.id === id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check access and cutoff
    if (req.user.role === 'customer') {
      if (booking.customerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      // Customer must check cutoff
      let bookingRules = store.bookingRules.find(
        (br) => br.appointmentTypeId === booking.appointmentTypeId
      );
      const cutoffHours = bookingRules?.cancellationCutoffHours || 24;

      if (isWithinCancellationCutoff(booking, cutoffHours)) {
        return res.status(409).json({
          success: false,
          message: `Cannot cancel within ${cutoffHours} hours of booking`,
        });
      }
    } else if (req.user.role === 'organiser') {
      // Organiser can cancel bookings for their appointmentTypes
      const appointmentType = store.appointmentTypes.find(
        (at) => at.id === booking.appointmentTypeId
      );
      if (!appointmentType || appointmentType.organiserId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Cancel and handle refund
    booking.status = 'cancelled';
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refund_pending';
    }

    return res.json({
      success: true,
      message: 'Booking cancelled',
      booking: toSafeBooking(booking),
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling booking',
    });
  }
}

/**
 * API 43: PUT /api/bookings/:id/confirm
 * Confirm pending booking
 */
function confirmBooking(req, res) {
  try {
    const { id } = req.params;
    const booking = store.bookings.find((b) => b.id === id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Must be pending
    if (booking.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: 'Only pending bookings can be confirmed',
      });
    }

    // Check access
    if (req.user.role === 'organiser') {
      const appointmentType = store.appointmentTypes.find(
        (at) => at.id === booking.appointmentTypeId
      );
      if (!appointmentType || appointmentType.organiserId !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Confirm
    booking.status = 'confirmed';

    return res.json({
      success: true,
      message: 'Booking confirmed',
      booking: toSafeBooking(booking),
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Error confirming booking',
    });
  }
}

export {
  createBooking,
  listBookings,
  getMyBookings,
  getBookingById,
  rescheduleBooking,
  cancelBooking,
  confirmBooking,
};
