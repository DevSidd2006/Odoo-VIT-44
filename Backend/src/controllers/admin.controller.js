import prisma from '../config/prisma.js';

const ALLOWED_ROLES = ['customer', 'organiser', 'admin'];

/**
 * Removes sensitive fields from authIdentity object and combines with profile.
 */
function toSafeUser(authIdentity) {
  return {
    id: authIdentity.id,
    fullName: authIdentity.userProfile?.fullName || 'N/A',
    email: authIdentity.email,
    role: authIdentity.role.roleName,
    isActive: authIdentity.isActive,
    createdAt: authIdentity.createdAt,
  };
}

/**
 * Returns all users with optional filters using Prisma.
 */
export async function getAllUsers(req, res) {
  try {
    const { role, isActive, search } = req.query;

    const where = {};

    if (role !== undefined) {
      where.role = {
        roleName: role.toUpperCase()
      };
    }

    if (isActive !== undefined) {
      where.isActive = String(isActive) === 'true';
    }

    if (search !== undefined && String(search).trim().length > 0) {
      const keyword = String(search).trim();
      where.OR = [
        { email: { contains: keyword, mode: 'insensitive' } },
        { userProfile: { fullName: { contains: keyword, mode: 'insensitive' } } }
      ];
    }

    const users = await prisma.authIdentity.findMany({
      where,
      include: {
        role: true,
        userProfile: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const safeUsers = users.map((user) => toSafeUser(user));

    return res.status(200).json({
      success: true,
      total: safeUsers.length,
      users: safeUsers,
    });
  } catch (error) {
    console.error('[GetAllUsers Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Updates a user's account active status using Prisma.
 */
export async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const userId = parseInt(id);

    const updatedUser = await prisma.authIdentity.update({
      where: { id: userId },
      data: { isActive },
      include: { role: true, userProfile: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Account status updated',
      user: toSafeUser(updatedUser),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Updates a user's role using Prisma.
 */
export async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const userId = parseInt(id);

    let roleRecord = await prisma.role.findUnique({
      where: { roleName: role.toUpperCase() }
    });

    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: { roleName: role.toUpperCase() }
      });
    }

    const updatedUser = await prisma.authIdentity.update({
      where: { id: userId },
      data: { roleId: roleRecord.id },
      include: { role: true, userProfile: true }
    });

    return res.status(200).json({
      success: true,
      message: 'Role updated',
      user: toSafeUser(updatedUser),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
}

/**
 * Returns dashboard statistics for admin using Prisma.
 */
export async function getDashboardStats(req, res) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalUsers,
      totalOrganisers,
      totalCustomers,
      totalServices,
      publishedServices,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      todayBookings,
      totalResources
    ] = await Promise.all([
      prisma.authIdentity.count(),
      prisma.authIdentity.count({ where: { role: { roleName: 'ORGANISER' } } }),
      prisma.authIdentity.count({ where: { role: { roleName: 'CUSTOMER' } } }),
      prisma.service.count(),
      prisma.service.count({ where: { isPublished: true } }),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'CONFIRMED' } }),
      prisma.appointment.count({ where: { status: 'CANCELLED' } }),
      prisma.appointment.count({
        where: {
          startTime: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      }),
      prisma.resource.count()
    ]);

    const stats = {
      totalUsers,
      totalOrganisers,
      totalCustomers,
      totalAppointmentTypes: totalServices,
      publishedAppointmentTypes: publishedServices,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      todayBookings,
      totalResources,
    };

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[GetDashboardStats Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
    });
  }
}
