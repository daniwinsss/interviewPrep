import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Rate Limiting (API Gateway)
// Strict limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 AI requests per hour per IP
  message: 'AI rate limit exceeded. Please try again later.'
});

// General limit for standard endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});

import judgeRoutes from './src/routes/judge.js';
import authRoutes from './src/routes/auth.js';
import interviewRoutes from './src/routes/interview.js';

app.use('/api/', generalLimiter);
app.use('/api/ai/', aiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/ai/interview', interviewRoutes);

// Placeholder Routes
app.get('/health', (req, res) => res.send('API is running'));

import { MongoMemoryServer } from 'mongodb-memory-server';

async function connectDB() {
  let uri = process.env.MONGO_URI;
  if (!uri || uri.includes('localhost')) {
    console.log('No remote MONGO_URI found. Starting local in-memory MongoDB for testing...');
    try {
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    } catch (e) {
      console.warn('Could not launch memory server. Make sure it is installed.');
    }
  }

  mongoose.connect(uri || 'mongodb://localhost:27017/interviewPrep')
    .then(() => console.log('MongoDB Connected to', uri))
    .catch((err) => console.error('MongoDB Connection Error:', err));
}

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
