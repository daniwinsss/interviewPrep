import express from 'express';
import Problem from '../models/Problem.js';
import Submission from '../models/Submission.js';
import { executionService } from '../services/executionService.js';

const router = express.Router();

function isVisibleProblem(problem) {
  const description = problem.description || '';
  const plainText = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const hasFallbackDescription = /See problem at usaco\.org/i.test(description);
  const hasUsableTests = Array.isArray(problem.testCases)
    && problem.testCases.some(tc => tc?.input?.trim() && tc?.output?.trim());

  return !hasFallbackDescription && plainText.length >= 120 && hasUsableTests;
}

function sanitizeExpectedOutput(output = '') {
  const normalized = String(output).replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  const paragraphs = normalized.split(/\n\s*\n/);
  const firstBlock = paragraphs[0]?.trim() || normalized;

  // If explanatory prose was scraped after the actual sample output,
  // keep only the first output block before the blank line.
  return firstBlock;
}

function normalizeJudgeOutput(output = '') {
  return String(output)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

function outputsMatch(actual = '', expected = '') {
  const normalizedActual = normalizeJudgeOutput(actual);
  const normalizedExpected = normalizeJudgeOutput(expected);

  if (normalizedActual === normalizedExpected) return true;

  const actualTokens = normalizedActual.split(/\s+/).filter(Boolean);
  const expectedTokens = normalizedExpected.split(/\s+/).filter(Boolean);
  return actualTokens.length === expectedTokens.length
    && actualTokens.every((token, index) => token === expectedTokens[index]);
}

function resultStatusToSubmissionStatus(status) {
  if (status === 'success') return null;
  if (status === 'tle') return 'tle';
  if (status === 'mle') return 'mle';
  if (status === 'compilation_error') return 'compilation_error';
  if (status === 'runtime_error') return 'runtime_error';
  return 'error';
}

// ─── GET /api/judge/problems ─────────────────────────────────────────────────
// Supports query params: ?division=Bronze&source=usaco
router.get('/problems', async (req, res) => {
  try {
    const filter = {};
    if (req.query.division) filter.division = req.query.division;
    if (req.query.source)   filter.source   = req.query.source;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const problems = await Problem.find(
      filter,
      'title difficulty division topic source contest usacoCpid languages createdAt description testCases'
    );

    const visibleProblems = problems
      .filter(isVisibleProblem)
      .map(problem => ({
        _id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        division: problem.division,
        topic: problem.topic,
        source: problem.source,
        contest: problem.contest,
        usacoCpid: problem.usacoCpid,
        languages: problem.languages,
        createdAt: problem.createdAt
      }));

    res.json(visibleProblems);
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
    const totalTestCaseCount = Array.isArray(problemObj.testCases) ? problemObj.testCases.length : 0;
    const visibleTestCases = problemObj.testCases.filter(tc => !tc.isHidden);

    // Filter to only expose visible test cases
    problemObj.testCases = visibleTestCases
      .map(tc => ({
        ...tc,
        output: sanitizeExpectedOutput(tc.output)
      }));
    problemObj.sampleTestCaseCount = problemObj.testCases.length;
    problemObj.hiddenTestCaseCount = totalTestCaseCount - problemObj.sampleTestCaseCount;
    problemObj.totalTestCaseCount = totalTestCaseCount;
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
    let maxMemory = 0;
    let firstError = null;
    const results = [];

    for (const [i, tc] of problem.testCases.entries()) {
      const result = await executionService.runCode({
        code,
        language,
        stdin: tc.input,
        timeoutMs: problem.timeLimit || 2000,
        memoryLimitMb: problem.memoryLimit || 256
      });

      totalTime += result.time;
      maxMemory = Math.max(maxMemory, result.memory || 0);

      const actualOutput = normalizeJudgeOutput(result.stdout || '');
      const expectedOutput = sanitizeExpectedOutput(tc.output || '');
      const executionFailure = resultStatusToSubmissionStatus(result.status);
      const passed_ = !executionFailure && outputsMatch(actualOutput, expectedOutput);
      const caseStatus = passed_ ? 'accepted' : (executionFailure || 'wrong_answer');

      if (passed_) {
        passed++;
      } else if (!firstError) {
        firstError = caseStatus;
      }

      results.push({
        testCase: i + 1,
        passed: passed_,
        status: caseStatus,
        time: result.time,
        memory: result.memory || 0,
        // Only show input/output for non-hidden test cases
        ...(tc.isHidden ? {} : {
          input: tc.input,
          expected: expectedOutput,
          actual: actualOutput,
          stderr: result.stderr,
          compile_output: result.compile_output
        })
      });

      if (!passed_) break;
    }

    const finalStatus = passed === problem.testCases.length
      ? 'accepted'
      : (firstError || 'wrong_answer');

    submission.status = finalStatus;
    submission.results = results;
    submission.time = totalTime;
    submission.memoryUsed = maxMemory;
    await submission.save();

    res.json({
      submissionId: submission._id,
      status: finalStatus,
      passed,
      total: problem.testCases.length,
      time: totalTime,
      memory: maxMemory,
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
