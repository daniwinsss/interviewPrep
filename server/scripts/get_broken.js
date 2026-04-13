import mongoose from 'mongoose';
import Problem from '../src/models/Problem.js';
import 'dotenv/config';

function isBroken(problem) {
  const description = problem.description || '';
  const hasFallbackDescription = /usaco\.org/i.test(description) || description.replace(/<[^>]+>/g, ' ').trim().length < 120;
  const hasUsableTests = Array.isArray(problem.testCases) && problem.testCases.some(tc => tc?.input?.trim() && tc?.output?.trim());
  return hasFallbackDescription || !hasUsableTests;
}

async function check() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep';
  await mongoose.connect(uri);

  const problems = await Problem.find({}, 'title usacoCpid description testCases');
  const broken = problems
    .filter(isBroken)
    .map((problem) => ({
      title: problem.title,
      usacoCpid: problem.usacoCpid,
      reason: /usaco\.org/i.test(problem.description || '') ? 'fallback-description' : 'missing-or-thin-content',
      testCaseCount: problem.testCases?.length || 0
    }));

  console.log('BROKEN_LIST:' + JSON.stringify(broken));
  await mongoose.disconnect();
}

check().catch(console.error);
