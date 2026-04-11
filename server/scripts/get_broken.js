import mongoose from 'mongoose';
import Problem from '../src/models/Problem.js';
import 'dotenv/config';

async function check() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep';
  await mongoose.connect(uri);
  const broken = await Problem.find({ description: /usaco\.org/ }, 'title usacoCpid');
  console.log('BROKEN_LIST:' + JSON.stringify(broken));
  await mongoose.disconnect();
}

check().catch(console.error);
