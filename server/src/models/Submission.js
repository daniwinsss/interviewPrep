import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  code: { type: String, required: true },
  language: { type: String, enum: ['javascript', 'python', 'cpp'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'wrong_answer', 'tle', 'error'], default: 'pending' },
  executionTime: { type: Number },
  memoryUsed: { type: Number },
  jobId: { type: String }
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
