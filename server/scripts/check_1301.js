import mongoose from 'mongoose';
import Problem from '../src/models/Problem.js';
import 'dotenv/config';

async function check() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep';
  await mongoose.connect(uri);
  const p = await Problem.findOne({ usacoCpid: 1301 });
  console.log('Hungry Cow CPID 1301:');
  console.log('Description:', p?.description);
  console.log('Topic:', p?.topic);
  console.log('Samples[0] Input:', p?.testCases[0]?.input);
  await mongoose.disconnect();
}

check().catch(console.error);
