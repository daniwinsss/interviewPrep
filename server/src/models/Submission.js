import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  code: { type: String, required: true },
  language: { type: String, enum: ['java', 'python', 'cpp'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'wrong_answer', 'tle', 'error'], default: 'pending' },
  time: { type: Number, default: 0 },
  memoryUsed: { type: Number },
  jobId: { type: String },
  results: [{
    testCase: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    status: { type: String, enum: ['accepted', 'wrong_answer', 'tle', 'error'], required: true },
    time: { type: Number, default: 0 },
    input: { type: String },
    expected: { type: String },
    actual: { type: String },
    stderr: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
