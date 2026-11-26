import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import healthRoutes from './routes/healthRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Trust reverse proxy headers when running behind Nginx or AWS ALB
app.set('trust proxy', 1);

// Security & logging middleware
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const rawCors = process.env.CORS_ORIGIN || 'http://localhost,http://localhost:5173';
const allowedOrigins = rawCors.split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true
  })
);

// Rate limiting on API routes (skips health probe)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api', apiLimiter);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 & Centralized Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
