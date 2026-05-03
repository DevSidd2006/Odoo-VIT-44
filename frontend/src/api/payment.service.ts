import api from './axios.instance';

export const paymentService = {
  async createPayment(appointmentId: number, amount: number) {
    const response = await api.post('/payments/create', {
      appointmentId,
      amount
    });
    return response.data;
  },

  async completePayment(paymentId: number) {
    const response = await api.post(`/payments/${paymentId}/complete`);
    return response.data;
  },

  async getPayment(paymentId: number) {
    const response = await api.get(`/payments/${paymentId}`);
    return response.data;
  },

  async getPaymentByAppointment(appointmentId: number) {
    const response = await api.get(`/payments/appointment/${appointmentId}`);
    return response.data;
  }
};
