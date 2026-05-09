import express from 'express';
import cors from 'cors';
import errorHandler from './middleware/errorMiddleware.js';

// ── Route imports ────────────────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import billRoutes from './routes/billRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import mealTokenRoutes from './routes/mealTokenRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

const app = express();

// ── CORS ─────────────────────────────────────────────────────────
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ── Body parsers ─────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── API Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/meal-tokens', mealTokenRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/profile',  profileRoutes);

// ── Health check ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ success: true, message: 'IIIT Allahabad Mess Management API is running' });
});

// ── Global error handler (must be LAST middleware) ───────────────
app.use(errorHandler);

export default app;
