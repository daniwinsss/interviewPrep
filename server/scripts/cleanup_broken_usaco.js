import mongoose from 'mongoose';
import Problem from '../src/models/Problem.js';
import 'dotenv/config';

function plainTextLength(html = '') {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
}

function isBroken(problem) {
  const description = problem.description || '';
  const fallbackDescription = /usaco\.org/i.test(description);
  const thinDescription = plainTextLength(description) < 120;
  const hasUsableTests = Array.isArray(problem.testCases) && problem.testCases.some(tc => tc?.input?.trim() && tc?.output?.trim());
  return fallbackDescription || thinDescription || !hasUsableTests;
}

async function main() {
  const dryRun = !process.argv.includes('--delete');
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep';
  await mongoose.connect(uri);

  const usacoProblems = await Problem.find({ source: 'usaco' }, 'title usacoCpid description testCases');
  const broken = usacoProblems.filter(isBroken);

  console.log(`Broken USACO problems found: ${broken.length}`);
  for (const problem of broken) {
    console.log(`- ${problem.title} (cpid=${problem.usacoCpid})`);
  }

  if (dryRun) {
    console.log('\nDry run only. Re-run with --delete to remove these rows.');
    await mongoose.disconnect();
    return;
  }

  const ids = broken.map(problem => problem._id);
  const result = ids.length > 0
    ? await Problem.deleteMany({ _id: { $in: ids } })
    : { deletedCount: 0 };

  console.log(`\nDeleted ${result.deletedCount} broken USACO problem(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
