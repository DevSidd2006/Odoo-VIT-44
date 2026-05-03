import express from 'express';
import cors from 'cors';
import appointmentTypeRoutes from './routes/appointment-type.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import userRoutes from './routes/user.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import reportRoutes from './routes/report.routes.js';
import { store } from './store/index.js';
import servicesRoutes from './routes/services.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import profileRoutes from './routes/profile.routes.js';
import paymentRoutes from './routes/payment.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

const apiRouter = express.Router();
app.use('/api', apiRouter);

// Dev-only routes for testing (disabled in production)
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/dev/reset', (req, res) => {
    store.users = [];
    store.otps = [];
    store.appointmentTypes = [];
    store.resources = [];
    store.schedules = {};
    store.questions = {};
    store.bookingRules = {};
    store.slots = {};
    store.bookings = [];
    return res.json({ success: true, message: 'Store reset' });
  });

  app.get('/api/dev/otp/:email', (req, res) => {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase();
    const otpRecord = store.otps
      .filter(item => item.email === normalizedEmail)
      .sort((a, b) => b.createdAt - a.createdAt)[0]; // latest
    if (!otpRecord) {
      return res.status(404).json({ success: false, message: 'OTP not found' });
    }
    return res.json({ success: true, otp: otpRecord.otp, type: otpRecord.type });
  });

  app.post('/api/dev/promote/:email', (req, res) => {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase();
    const user = store.users.find(u => u.email === normalizedEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.role = req.body.role || 'admin';
    return res.json({ success: true, message: 'User promoted', user });
  });
}

apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/appointment-types', appointmentTypeRoutes);
apiRouter.use('/resources', resourceRoutes);
apiRouter.use('/users', userRoutes);

apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/appointments', appointmentsRoutes);
apiRouter.use('/profile', profileRoutes);
apiRouter.use('/payments', paymentRoutes);


app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
});

export default app;
