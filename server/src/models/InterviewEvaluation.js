import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: true,
    index: true
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewMessage',
    required: true
  },
  scores: {
    correctness: { type: Number, default: 0 },
    complexity: { type: Number, default: 0 },
    edgeCases: { type: Number, default: 0 },
    communication: { type: Number, default: 0 }
  },
  total: { type: Number, default: 0 },
  strengths: [{ type: String }],
  gaps: [{ type: String }],
  nextHint: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });


export default mongoose.model('InterviewEvaluation', evaluationSchema);
