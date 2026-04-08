import express from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';

const router = express.Router();
const connection = new IORedis(process.env.REDIS_URI || 'redis://localhost:6379', { maxRetriesPerRequest: null });

connection.on('error', (err) => {
  console.warn('Redis Connection Error (Judge Route): You need to start Redis to submit code.', err.message);
});

const executionQueue = new Queue('code-execution', { connection });

executionQueue.on('error', (err) => {
  // Suppress BullMQ queue errors when Redis is not running locally for the MVP.
});

// 1. Get all problems
router.get('/problems', async (req, res) => {
  try {
    const problems = await Problem.find({}, 'title difficulty company');
    res.json(problems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get specific problem
router.get('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    res.json(problem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Submit code
router.post('/submissions', async (req, res) => {
  try {
    const { userId, problemId, code, language } = req.body;

    // Create a pending submission in DB
    const submission = new Submission({
      userId,
      problemId,
      code,
      language,
      status: 'pending'
    });
    await submission.save();

    // Push job to queue
    const job = await executionQueue.add('execute', {
      submissionId: submission._id,
      problemId,
      code,
      language
    });

    submission.jobId = job.id;
    await submission.save();

    res.json({ submissionId: submission._id, jobId: job.id, status: 'pending' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get submission status
router.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
