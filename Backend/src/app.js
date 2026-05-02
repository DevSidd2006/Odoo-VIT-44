import express from 'express';
import cors from 'cors';
import appointmentTypeRoutes from './routes/appointment-type.routes.js';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import resourceRoutes from './routes/resource.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

const apiRouter = express.Router();
app.use('/api', apiRouter);

apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/appointment-types', appointmentTypeRoutes);
apiRouter.use('/resources', resourceRoutes);
apiRouter.use('/users', userRoutes);

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
  });
});

export default app;
