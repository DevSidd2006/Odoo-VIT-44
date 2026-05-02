import prisma from '../config/prisma.js';

export async function getProfile(req, res) {
  try {
    // Hardcoded for development. Use req.user.id in production.
    const authIdentityId = 1; 

    const profile = await prisma.userProfile.findUnique({
      where: { authIdentityId }
    });

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('[GetProfile Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function updateProfile(req, res) {
  try {
    const authIdentityId = 1; 
    const { fullName, phone, gender, dateOfBirth } = req.body;

    const profile = await prisma.userProfile.upsert({
      where: { authIdentityId },
      update: {
        fullName,
        phone,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
      create: {
        authIdentityId,
        fullName,
        phone,
        gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      }
    });

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('[UpdateProfile Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getProfileAppointments(req, res) {
  try {
    const customerId = 1; 

    const appointments = await prisma.appointment.findMany({
      where: { customerId },
      include: {
        service: true,
        provider: {
          include: {
            authIdentity: {
              include: {
                userProfile: true
              }
            }
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    console.error('[GetProfileAppointments Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
