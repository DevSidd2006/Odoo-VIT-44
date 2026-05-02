import { store } from '../store/index.js';

/**
 * Get today's date in YYYY-MM-DD format
 */
function startOfToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Parse time string (HH:MM) to hour number (0-23)
 */
function timeToHour(time) {
  const parts = time.split(':');
  return parseInt(parts[0]) || 0;
}

/**
 * Format hour number to HH:00 format
 */
function hourToString(hour) {
  return String(hour).padStart(2, '0') + ':00';
}

/**
 * Check if a date is within a range (inclusive)
 */
function isDateInRange(date, from, to) {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

/**
 * API 45: GET /api/reports/total-appointments
 * Get total appointments report with breakdown by type and daily
 */
export function getTotalAppointmentsReport(req, res) {
  try {
    const { from, to, appointmentTypeId } = req.query;

    // Get eligible appointmentTypes
    let appointmentTypes = [...store.appointmentTypes];
    if (req.user.role === 'organiser') {
      appointmentTypes = appointmentTypes.filter(
        (at) => at.organiserId === req.user.userId
      );
    }

    if (appointmentTypeId) {
      appointmentTypes = appointmentTypes.filter(
        (at) => at.id === appointmentTypeId
      );
    }

    const appointmentTypeIds = appointmentTypes.map((at) => at.id);

    // Filter bookings by appointmentTypes and date range
    let bookings = store.bookings.filter((b) =>
      appointmentTypeIds.includes(b.appointmentTypeId)
    );

    if (from || to) {
      bookings = bookings.filter((b) => isDateInRange(b.date, from, to));
    }

    // Calculate totals
    const total = bookings.length;
    const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
    const pending = bookings.filter((b) => b.status === 'pending').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

    // Group by appointmentType
    const byAppointmentTypeMap = new Map();
    bookings.forEach((b) => {
      if (!byAppointmentTypeMap.has(b.appointmentTypeId)) {
        byAppointmentTypeMap.set(b.appointmentTypeId, 0);
      }
      byAppointmentTypeMap.set(
        b.appointmentTypeId,
        byAppointmentTypeMap.get(b.appointmentTypeId) + 1
      );
    });

    const byAppointmentType = Array.from(byAppointmentTypeMap.entries()).map(
      ([atId, count]) => {
        const at = appointmentTypes.find((a) => a.id === atId);
        return {
          title: at?.title || 'Unknown',
          count,
        };
      }
    );

    // Daily breakdown
    const dailyMap = new Map();
    bookings.forEach((b) => {
      if (!dailyMap.has(b.date)) {
        dailyMap.set(b.date, 0);
      }
      dailyMap.set(b.date, dailyMap.get(b.date) + 1);
    });

    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const report = {
      total,
      confirmed,
      pending,
      cancelled,
      byAppointmentType,
      dailyBreakdown,
    };

    return res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Error generating total appointments report:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating report',
    });
  }
}

/**
 * API 46: GET /api/reports/peak-hours
 * Get peak booking hours report
 */
export function getPeakHoursReport(req, res) {
  try {
    const { from, to, appointmentTypeId } = req.query;

    // Get eligible appointmentTypes
    let appointmentTypes = [...store.appointmentTypes];
    if (req.user.role === 'organiser') {
      appointmentTypes = appointmentTypes.filter(
        (at) => at.organiserId === req.user.userId
      );
    }

    if (appointmentTypeId) {
      appointmentTypes = appointmentTypes.filter(
        (at) => at.id === appointmentTypeId
      );
    }

    const appointmentTypeIds = appointmentTypes.map((at) => at.id);

    // Filter bookings by appointmentTypes and date range
    let bookings = store.bookings.filter((b) =>
      appointmentTypeIds.includes(b.appointmentTypeId)
    );

    if (from || to) {
      bookings = bookings.filter((b) => isDateInRange(b.date, from, to));
    }

    // Group by hour
    const hourMap = new Map();
    for (let h = 0; h < 24; h++) {
      hourMap.set(h, 0);
    }

    bookings.forEach((b) => {
      const hour = timeToHour(b.startTime);
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    // Convert to array and sort by count descending
    const peakHours = Array.from(hourMap.entries())
      .map(([hour, count]) => ({
        hour: hourToString(hour),
        bookingCount: count,
      }))
      .sort((a, b) => b.bookingCount - a.bookingCount);

    return res.json({
      success: true,
      peakHours,
    });
  } catch (error) {
    console.error('Error generating peak hours report:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating report',
    });
  }
}

/**
 * API 47: GET /api/reports/provider-utilization
 * Get provider utilization report
 */
export function getProviderUtilizationReport(req, res) {
  try {
    const { from, to } = req.query;

    // Get list of organisers to analyze
    let organisers = store.users.filter((u) => u.role === 'organiser');
    if (req.user.role === 'organiser') {
      organisers = organisers.filter((u) => u.id === req.user.userId);
    }

    const utilization = organisers.map((organiser) => {
      // Get organiser's appointmentTypes
      const organisersTypes = store.appointmentTypes.filter(
        (at) => at.organiserId === organiser.id
      );
      const typeIds = organisersTypes.map((at) => at.id);

      // Get bookings for their types
      let bookings = store.bookings.filter((b) => typeIds.includes(b.appointmentTypeId));

      if (from || to) {
        bookings = bookings.filter((b) => isDateInRange(b.date, from, to));
      }

      const totalBookings = bookings.length;
      const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
      const confirmedRate = totalBookings > 0 ? (confirmedCount / totalBookings) * 100 : 0;

      // For resource-type appointments, calculate per-resource utilization
      const resources = [];
      const resourceTypeIds = organisersTypes
        .filter((at) => at.type === 'resource')
        .map((at) => at.id);

      if (resourceTypeIds.length > 0) {
        const resourceMap = new Map();

        // Get all resources used in these appointments
        const usedResourceIds = new Set();
        bookings
          .filter((b) => resourceTypeIds.includes(b.appointmentTypeId))
          .forEach((b) => {
            if (b.resourceId) usedResourceIds.add(b.resourceId);
          });

        // Calculate utilization per resource
        usedResourceIds.forEach((resourceId) => {
          const resourceBookings = bookings.filter(
            (b) => b.resourceId === resourceId && resourceTypeIds.includes(b.appointmentTypeId)
          );
          const resourceConfirmed = resourceBookings.filter(
            (b) => b.status === 'confirmed'
          ).length;
          const resourceUtilizationRate =
            resourceBookings.length > 0
              ? (resourceConfirmed / resourceBookings.length) * 100
              : 0;

          const resource = store.resources.find((r) => r.id === resourceId);
          resources.push({
            resourceId,
            resourceName: resource?.name || 'Unknown',
            totalBookings: resourceBookings.length,
            confirmedBookings: resourceConfirmed,
            utilizationRate: Math.round(resourceUtilizationRate * 100) / 100,
          });
        });
      }

      return {
        providerId: organiser.id,
        providerName: organiser.fullName,
        totalAppointmentTypes: organisersTypes.length,
        totalBookings,
        confirmedRate: Math.round(confirmedRate * 100) / 100,
        resources,
      };
    });

    return res.json({
      success: true,
      utilization,
    });
  } catch (error) {
    console.error('Error generating provider utilization report:', error);
    return res.status(500).json({
      success: false,
      message: 'Error generating report',
    });
  }
}

export default {
  getTotalAppointmentsReport,
  getPeakHoursReport,
  getProviderUtilizationReport,
};
