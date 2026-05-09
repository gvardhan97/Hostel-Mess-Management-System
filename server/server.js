import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

// ── Load environment variables ───────────────────────────────────
dotenv.config();

// ── Connect to MongoDB ──────────────────────────────────────────
connectDB();

// ── Start server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
