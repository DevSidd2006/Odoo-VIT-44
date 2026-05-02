import prisma from '../config/prisma.js';

export async function bookAppointment(req, res) {
  try {
    const { providerId, serviceId, slotId, startTime, endTime, capacity, responses } = req.body;
    
    // For development/testing: find the first available user in the DB
    const user = await prisma.authIdentity.findFirst();
    const customerId = user ? user.id : 1; 

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        providerId,
        serviceId,
        slotId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        totalPrice: 0, // Should be fetched from service
        status: 'PENDING',
        responses: {
          create: responses?.map(r => ({
            questionId: r.questionId,
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
    const changedById = 1; // req.user.id

    const existingAppt = await prisma.appointment.findUnique({ where: { id: parseInt(id) } });
    if (!existingAppt) return res.status(404).json({ success: false, message: 'Not found' });

    // Update appointment
    const updated = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: {
        slotId: newSlotId,
        startTime: new Date(newStartTime),
        endTime: new Date(newEndTime),
        history: {
          create: {
            oldStartTime: existingAppt.startTime,
            newStartTime: new Date(newStartTime),
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
    const { providerId, serviceId, date } = req.query;
    
    // 1. Get all slots for this provider
    const slots = await prisma.scheduleSlot.findMany({
      where: {
        plan: { providerId: parseInt(providerId) },
        // Simple logic: filter by day of week if date is provided
        dayOfWeek: date ? new Date(date).getDay() : undefined,
      }
    });

    // 2. Get existing appointments for these slots on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        providerId: parseInt(providerId),
        startTime: {
          gte: new Date(`${date}T00:00:00Z`),
          lte: new Date(`${date}T23:59:59Z`),
        },
        status: { not: 'CANCELLED' }
      }
    });

    // 3. Mark slots as available or full
    const availability = slots.map(slot => {
      const appointmentsInSlot = existingAppointments.filter(a => a.slotId === slot.id);
      return {
        ...slot,
        isAvailable: appointmentsInSlot.length < slot.capacity && !slot.isBlocked
      };
    });

    res.status(200).json({ success: true, data: availability });
  } catch (error) {
    console.error('[GetAvailability Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
