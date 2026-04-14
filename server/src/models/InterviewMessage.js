import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewSession',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['interviewer', 'user'],
    required: true
  },
  content: { type: String, required: true },
  phase: { type: String, default: null },
  action: { type: String, default: null },
  screenshotUrl: { type: String, default: null },
  audioTranscript: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false });

messageSchema.index({ sessionId: 1, createdAt: 1 });

export default mongoose.model('InterviewMessage', messageSchema);
