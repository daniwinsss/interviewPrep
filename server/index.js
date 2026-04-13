import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors());
app.use(express.json());

// Rate Limiting (API Gateway)
// Strict limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 AI requests per hour per IP
  message: 'AI rate limit exceeded. Please try again later.',
  skip: () => !isProduction
});

// General limit for standard endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  skip: () => !isProduction
});

import judgeRoutes from './src/routes/judge.js';
import authRoutes from './src/routes/auth.js';
import interviewRoutes from './src/routes/interview.js';
import mcqRoutes from './src/routes/mcq.js';

app.use('/api/', generalLimiter);
app.use('/api/ai/', aiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/ai/interview', interviewRoutes);
app.use('/api/mcq', mcqRoutes);

// Placeholder Routes
app.get('/health', (req, res) => res.send('API is running'));

connectDB();

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep';
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected to', uri.includes('@') ? uri.split('@')[1] : uri);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
