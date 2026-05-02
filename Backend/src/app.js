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

const app = express();

app.use(cors());
app.use(express.json());

const apiRouter = express.Router();
app.use('/api', apiRouter);

// Dev-only routes (for testing)
if (process.env.NODE_ENV !== 'production') {
  apiRouter.post('/dev/reset', (req, res) => {
    store.users = [];
    store.otps = [];
    store.appointmentTypes = [];
    store.resources = [];
    store.schedules = [];
    store.questions = [];
    store.bookingRules = [];
    store.slots = [];
    store.bookings = [];
    res.json({ success: true, message: 'Store reset' });
  });

  apiRouter.get('/dev/otp/:email', (req, res) => {
    const { email } = req.params;
    const otps = store.otps.filter(o => o.email === email);
    if (otps.length === 0) {
      return res.status(404).json({ success: false, message: 'No OTP found' });
    }
    const latestOtp = otps[otps.length - 1];
    res.json({ success: true, otp: latestOtp.code, type: latestOtp.type });
  });

  // Dev-only: directly set a user's role (used to bootstrap admin in tests)
  apiRouter.post('/dev/promote', (req, res) => {
    const { userId, role } = req.body;
    const allowed = ['customer', 'organiser', 'admin'];
    if (!userId || !allowed.includes(role)) {
      return res.status(400).json({ success: false, message: 'userId and valid role are required' });
    }
    const user = store.users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    user.role = role;
    return res.json({ success: true, message: `Role updated to ${role}`, userId: user.id, role: user.role });
  });
}

apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/appointment-types', appointmentTypeRoutes);
apiRouter.use('/resources', resourceRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/reports', reportRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
});

export default app;
