import express from 'express';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { executionService } from '../services/executionService.js';

const router = express.Router();

// Redis / BullMQ Queue — gracefully optional
let executionQueue = null;
try {
  const connection = new IORedis(process.env.REDIS_URI || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
  });
  connection.on('error', () => {}); // Suppress noise
  executionQueue = new Queue('code-execution', { connection });
  executionQueue.on('error', () => {}); // Suppress noise
} catch (_) {}

// ─── GET /api/judge/problems ─────────────────────────────────────────────────
// Supports query params: ?division=Bronze&source=usaco
router.get('/problems', async (req, res) => {
  try {
    const filter = {};
    if (req.query.division) filter.division = req.query.division;
    if (req.query.source)   filter.source   = req.query.source;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const problems = await Problem.find(filter, 'title difficulty division source contest usacoCpid languages createdAt');
    res.json(problems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/judge/problems/:id ─────────────────────────────────────────────
router.get('/problems/:id', async (req, res) => {
  try {
    // Only return non-hidden test cases to the client
    const problem = await Problem.findById(req.params.id).select('-testCases.isHidden');
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    
    const problemObj = problem.toObject();
    // Filter to only expose visible test cases
    problemObj.testCases = problemObj.testCases.filter(tc => !tc.isHidden);
    res.json(problemObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/judge/run ─────────────────────────────────────────────────────
// Run code against a single custom input (for testing in editor)
router.post('/run', async (req, res) => {
  try {
    const { code, language, stdin = '' } = req.body;
    if (!code || !language) return res.status(400).json({ error: 'code and language are required' });

    const result = await executionService.runCode({ code, language, stdin });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/judge/submissions ─────────────────────────────────────────────
// Submit code and run against all test cases
router.post('/submissions', async (req, res) => {
  try {
    const { userId, problemId, code, language } = req.body;
    if (!code || !language || !problemId) {
      return res.status(400).json({ error: 'code, language, problemId are required' });
    }

    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    // Create a pending submission
    const submission = new Submission({
      userId: userId || 'anonymous',
      problemId,
      code,
      language,
      status: 'pending'
    });
    await submission.save();

    // Run synchronously against all test cases (no Redis needed)
    let passed = 0;
    let totalTime = 0;
    let firstError = null;
    const results = [];

    for (const [i, tc] of problem.testCases.entries()) {
      const result = await executionService.runCode({
        code,
        language,
        stdin: tc.input,
        timeoutMs: problem.timeLimit || 2000
      });

      totalTime += result.time;

      const actualOutput = (result.stdout || '').trim();
      const expectedOutput = (tc.output || '').trim();
      const passed_ = actualOutput === expectedOutput;

      if (passed_) {
        passed++;
      } else if (!firstError) {
        firstError = result.status === 'tle' ? 'tle' 
          : result.status === 'error' ? 'error'
          : 'wrong_answer';
      }

      results.push({
        testCase: i + 1,
        passed: passed_,
        status: passed_ ? 'accepted' : (result.status === 'tle' ? 'tle' : result.status === 'error' ? 'error' : 'wrong_answer'),
        time: result.time,
        // Only show input/output for non-hidden test cases
        ...(tc.isHidden ? {} : {
          input: tc.input,
          expected: expectedOutput,
          actual: actualOutput,
          stderr: result.stderr
        })
      });
    }

    const finalStatus = passed === problem.testCases.length
      ? 'accepted'
      : (firstError || 'wrong_answer');

    submission.status = finalStatus;
    submission.results = results;
    submission.time = totalTime;
    await submission.save();

    res.json({
      submissionId: submission._id,
      status: finalStatus,
      passed,
      total: problem.testCases.length,
      time: totalTime,
      results
    });

  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/judge/submissions/:id ──────────────────────────────────────────
router.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
