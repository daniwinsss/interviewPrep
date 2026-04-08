import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { executionService } from './src/services/executionService.js';
import Submission from './src/models/Submission.js';
import Problem from './src/models/Problem.js';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URI || 'redis://localhost:6379', { maxRetriesPerRequest: null });

connection.on('error', (err) => {
  console.warn('Redis Connection Error (Worker): Is Redis running?', err.message);
});

// DB Connection for the worker process
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep')
  .then(() => console.log('Worker: MongoDB Connected'))
  .catch((err) => console.error('Worker: MongoDB Connection Error:', err));

console.log('Worker process starting...');

const executionWorker = new Worker('code-execution', async job => {
  console.log(`Processing job ${job.id}`);
  const { submissionId, code, language, problemId } = job.data;

  try {
    const problem = await Problem.findById(problemId);
    if (!problem) throw new Error('Problem not found');

    let allAccepted = true;
    let maxTime = 0;
    let failReason = 'accepted';

    // We run each test case by appending a small runner wrapper to the user's code.
    for (const tc of problem.testCases) {
      let runCode = code;
      // In MVP, we assume the test case input is JSON-parsable arguments, and output is expected stdout
      if (language === 'javascript') {
        runCode += `\n\n// Test Evaluation\nconsole.log(solution(${tc.input}));`;
      } else if (language === 'python') {
        runCode += `\n\n# Test Evaluation\nprint(solution(${tc.input}))`;
      }

      const result = await executionService.runCode({ code: runCode, language, timeoutMs: 2000 });

      maxTime = Math.max(maxTime, result.time);

      if (result.status === 'tle') {
        allAccepted = false;
        failReason = 'tle';
        break;
      }
      
      if (result.error || result.stderr) {
        allAccepted = false;
        failReason = 'error';
        break;
      }

      const cleanOutput = result.stdout.trim();
      if (cleanOutput !== tc.output.trim()) {
        allAccepted = false;
        failReason = 'wrong_answer';
        break;
      }
    }

    const finalStatus = allAccepted ? 'accepted' : failReason;

    await Submission.findByIdAndUpdate(submissionId, {
      status: finalStatus,
      executionTime: maxTime,
    });

    return { status: finalStatus, maxTime };
  } catch (err) {
    console.error(err);
    await Submission.findByIdAndUpdate(submissionId, { status: 'error' });
    throw err;
  }
}, { connection });

executionWorker.on('completed', job => {
  console.log(`Job ${job.id} completed! Target Output DB states updated.`);
});

executionWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} has failed with error: ${err.message}`);
});
