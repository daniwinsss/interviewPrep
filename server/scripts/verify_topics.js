import mongoose from 'mongoose';
import Problem from '../src/models/Problem.js';
import 'dotenv/config';

async function verify() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/interviewPrep';
  await mongoose.connect(uri);
  const p = await Problem.findOne({ usacoCpid: 1236 });
  console.log('Problem 1236 Topic:', p?.topic);
  
  const allCounts = await Problem.aggregate([
    { $group: { _id: '$topic', count: { $sum: 1 } } }
  ]);
  console.log('Topic Counts:', JSON.stringify(allCounts, null, 2));
  
  await mongoose.disconnect();
}

verify().catch(console.error);
