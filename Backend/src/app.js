import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import servicesRoutes from './routes/services.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import profileRoutes from './routes/profile.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/services', servicesRoutes);
apiRouter.use('/appointments', appointmentsRoutes);
apiRouter.use('/profile', profileRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
});

export default app;
