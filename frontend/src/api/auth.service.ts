import api from './axios.instance';

export const authService = {
  async signup(data: any) {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  async verifyOtp(data: any) {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
  },

  async login(data: any) {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  async forgotPassword(data: any) {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  async resetPassword(data: any) {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  async resendOtp(data: any) {
    const response = await api.post('/auth/resend-otp', data);
    return response.data;
  },
};
