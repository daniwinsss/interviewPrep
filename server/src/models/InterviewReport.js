import mongoose from 'mongoose';

const studyPlanItemSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
  resources: [{ type: String }]
}, { _id: false });

const reportSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewSession',
    unique: true,
    required: true
  },
  userId: { type: String, required: true, index: true },
  overallScore: { type: Number, default: 0 },
  scoreByPhase: { type: Map, of: Number, default: {} },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  studyPlan: [studyPlanItemSchema],
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: false });

reportSchema.index({ userId: 1, generatedAt: -1 });

export default mongoose.model('InterviewReport', reportSchema);
