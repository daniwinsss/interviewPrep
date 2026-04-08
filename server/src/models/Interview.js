import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, enum: ['DSA', 'Behavioral', 'System Design'], required: true },
  messages: [{
    role: { type: String, enum: ['ai', 'user'], required: true },
    content: { type: String, required: true },
    rating: { type: Number }
  }],
  overallScore: { type: Number }
}, { timestamps: true });

export default mongoose.model('Interview', interviewSchema);
