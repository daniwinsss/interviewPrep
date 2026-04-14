import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import judgeRoutes from './routes/judge.js';
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import mcqRoutes from './routes/mcq.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'AI rate limit exceeded. Please try again later.',
  skip: () => !isProduction
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: () => !isProduction
});

app.use('/api/', generalLimiter);
app.use('/api/ai/', aiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/judge', judgeRoutes);
app.use('/api/ai/interview', interviewRoutes);
app.use('/api/mcq', mcqRoutes);

app.get('/health', (req, res) => res.send('API is running'));

let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep';
    connectionPromise = mongoose.connect(uri)
      .then(() => mongoose.connection)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
}

export default app;
