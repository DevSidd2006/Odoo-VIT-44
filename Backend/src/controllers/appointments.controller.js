import prisma from '../config/prisma.js';

export async function bookAppointment(req, res) {
  try {
    const { providerId, serviceId, slotId, startTime, endTime, responses } = req.body;
    
    // Validate dates
    const appointmentStartTime = new Date(startTime);
    const appointmentEndTime = new Date(endTime);

    if (isNaN(appointmentStartTime.getTime()) || isNaN(appointmentEndTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid startTime or endTime' });
    }

    // Check if user is authenticated (mocking for now, ideally req.user.id)
    const user = await prisma.authIdentity.findFirst({
      where: { role: { roleName: 'CUSTOMER' } }
    });
    const customerId = user ? user.id : 1; 

    const service = await prisma.service.findUnique({
      where: { id: parseInt(serviceId) }
    });

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Check if slot is already full
    const existingBookings = await prisma.appointment.count({
      where: {
        slotId: parseInt(slotId),
        startTime: appointmentStartTime,
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: parseInt(slotId) }
    });

    if (!slot || existingBookings >= slot.capacity) {
      return res.status(400).json({ success: false, message: 'Slot is no longer available' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        providerId: parseInt(providerId),
        serviceId: parseInt(serviceId),
        slotId: parseInt(slotId),
        startTime: appointmentStartTime,
        endTime: appointmentEndTime,
        totalPrice: service.price,
        status: 'PENDING',
        responses: {
          create: responses?.map(r => ({
            questionId: parseInt(r.questionId),
            answer: r.answer,
          })) || []
        }
      }
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error('[BookAppointment Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function rescheduleAppointment(req, res) {
  try {
    const { id } = req.params;
    const { newSlotId, newStartTime, newEndTime } = req.body;
    const changedById = 1;

    const appointmentStartTime = new Date(newStartTime);
    const appointmentEndTime = new Date(newEndTime);

    if (isNaN(appointmentStartTime.getTime()) || isNaN(appointmentEndTime.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid startTime or endTime' });
    }

    const existingAppt = await prisma.appointment.findUnique({ where: { id: parseInt(id) } });
    if (!existingAppt) return res.status(404).json({ success: false, message: 'Not found' });

    const updated = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        slotId: parseInt(newSlotId),
        startTime: appointmentStartTime,
        endTime: appointmentEndTime,
        history: {
          create: {
            oldStartTime: existingAppt.startTime,
            newStartTime: appointmentStartTime,
            changedById,
            reason: 'Customer rescheduled',
          }
        }
      }
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('[Reschedule Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function cancelAppointment(req, res) {
  try {
    const { id } = req.params;
    
    const updated = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' }
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('[Cancel Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getAvailability(req, res) {
  try {
    const { serviceId, providerId, date } = req.query;
    
    if (!date || !serviceId || !providerId) {
      return res.status(400).json({ success: false, message: 'serviceId, providerId and date are required' });
    }

    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay(); 

    const plan = await prisma.availabilityPlan.findFirst({
      where: {
        providerId: parseInt(providerId),
        isActive: true,
      },
      include: {
        slots: {
          where: {
            OR: [
              { dayOfWeek: dayOfWeek },
              { specificDate: { equals: bookingDate } }
            ],
            isBlocked: false,
          }
        }
      }
    });

    if (!plan || !plan.slots.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const slotsWithAvailability = await Promise.all(plan.slots.map(async slot => {
      // Calculate specific DateTime for this slot on the requested date
      const [hours, minutes] = slot.startTime.split(':');
      const slotStartTime = new Date(date);
      slotStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const bookedCount = await prisma.appointment.count({
        where: {
          slotId: slot.id,
          startTime: slotStartTime,
          status: { in: ['PENDING', 'CONFIRMED'] }
        }
      });

      return {
        ...slot,
        isAvailable: bookedCount < slot.capacity
      };
    }));

    res.status(200).json({ success: true, data: slotsWithAvailability.sort((a, b) => a.startTime.localeCompare(b.startTime)) });
  } catch (error) {
    console.error('[GetAvailability Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}