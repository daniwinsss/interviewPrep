import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' },
  topic: { type: String, enum: ['DSA', 'Behavioral', 'System Design', 'Project Experience'], required: true },
  messages: [{
    role: { type: String, enum: ['ai', 'user'], required: true },
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 10 }
  }],
  askedQuestions: [{ type: String }],
  completed: { type: Boolean, default: false },
  overallScore: { type: Number }
}, { timestamps: true });

export default mongoose.model('Interview', interviewSchema);
