import prisma from '../config/prisma.js';

/**
 * Get all published services grouped by category
 */
export async function getServices(req, res) {
  try {
    const categories = await prisma.serviceCategory.findMany({
      include: {
        services: {
          where: { isPublished: true },
          include: {
            questions: true,
          },
        },
      },
    });
    
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('[GetServices Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * Get a specific service by ID
 */
export async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        questions: true,
        providerMappings: {
          include: {
            provider: {
              include: {
                authIdentity: {
                  include: {
                    userProfile: true,
                  }
                }
              }
            }
          }
        }
      },
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.status(200).json({ success: true, data: service });
  } catch (error) {
    console.error('[GetServiceById Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
