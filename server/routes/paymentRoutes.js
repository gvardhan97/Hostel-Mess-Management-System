import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ── Student payment routes ───────────────────────────────────────
router.post('/create-order', protect, authorize('student'), createOrder);
router.post('/verify',       protect, authorize('student'), verifyPayment);

export default router;
