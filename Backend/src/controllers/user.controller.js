import { store } from '../store/index.js';

/**
 * Removes sensitive fields from user object.
 *
 * @param {object} user - User object from in-memory store.
 * @returns {object} Safe user payload.
 */
function toSafeUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

/**
 * Returns the authenticated user's profile.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function getMyProfile(req, res) {
  try {
    const user = store.users.find((item) => item.id === req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Updates authenticated user's profile.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function updateMyProfile(req, res) {
  try {
    const user = store.users.find((item) => item.id === req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const { fullName } = req.body;

    if (fullName !== undefined) {
      if (typeof fullName !== 'string' || fullName.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'fullName must be a non-empty string',
        });
      }

      user.fullName = fullName.trim();
    }

    return res.status(200).json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Returns authenticated user's appointments split into upcoming and past.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {import('express').Response} HTTP response.
 */
export function getMyAppointments(req, res) {
  try {
    const { status = 'all' } = req.query;

    if (!['all', 'upcoming', 'past'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status must be one of: upcoming, past, all',
      });
    }

    const currentUser = store.users.find((item) => item.id === req.user.userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const providerById = new Map(store.users.map((user) => [user.id, user]));
    const appointmentTypeById = new Map(
      store.appointmentTypes.map((appointmentType) => [appointmentType.id, appointmentType]),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mappedBookings = store.bookings
      .filter((booking) => booking.customerId === req.user.userId)
      .map((booking) => {
        const appointmentType = appointmentTypeById.get(booking.appointmentTypeId);
        const provider = providerById.get(booking.providerId);

        return {
          id: booking.id,
          appointmentTitle: appointmentType?.title || null,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          location: appointmentType?.location || null,
          providerName: provider?.fullName || null,
        };
      });

    const upcoming = mappedBookings
      .filter((booking) => {
        const bookingDate = new Date(booking.date);
        return bookingDate >= today && booking.status !== 'cancelled';
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const past = mappedBookings
      .filter((booking) => {
        const bookingDate = new Date(booking.date);
        return bookingDate < today || booking.status === 'cancelled';
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (status === 'upcoming') {
      return res.status(200).json({
        success: true,
        upcoming,
        past: [],
      });
    }

    if (status === 'past') {
      return res.status(200).json({
        success: true,
        upcoming: [],
        past,
      });
    }

    return res.status(200).json({
      success: true,
      upcoming,
      past,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}
