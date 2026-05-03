import prisma from '../config/prisma.js';

export async function createPayment(req, res) {
  try {
    const { appointmentId, amount } = req.body;

    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) }
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const payment = await prisma.payment.create({
      data: {
        appointmentId: parseInt(appointmentId),
        amount: parseFloat(amount),
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error('[CreatePayment Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function completePayment(req, res) {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.update({
      where: { id: parseInt(id) },
      data: { 
        status: 'PAID',
        transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        method: 'Mock Card'
      }
    });

    // Update appointment status to CONFIRMED when payment is PAID
    await prisma.appointment.update({
      where: { id: payment.appointmentId },
      data: { status: 'CONFIRMED' }
    });

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error('[CompletePayment Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getPayment(req, res) {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
      include: { appointment: true }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error('[GetPayment Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

export async function getPaymentByAppointment(req, res) {
  try {
    const { appointmentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { appointmentId: parseInt(appointmentId) }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found for this appointment' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error('[GetPaymentByAppt Error]:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
