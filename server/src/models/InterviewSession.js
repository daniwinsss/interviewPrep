import mongoose from 'mongoose';

const phaseHistorySchema = new mongoose.Schema({
  phase: { type: String, required: true },
  enteredAt: { type: Date, default: Date.now }
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  config: {
    roundType: {
      type: String,
      enum: ['dsa', 'system_design', 'project', 'behavioural', 'core_cs'],
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    durationMin: { type: Number, default: 45 },
    company: { type: String, default: 'generic' },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewQuestion', default: null },
    userName: { type: String, default: 'Candidate' }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  currentPhase: { type: String, required: true },
  phaseHistory: [phaseHistorySchema],
  askedQuestions: [{ type: String }],
  questionSnapshot: {
    title: String,
    content: String,
    constraints: String,
    examples: String,
    targetTC: String,
    targetSC: String,
    scaleHints: String,
    lpPrinciples: [String],
    phases: [String],
    tags: [String],
    leetcodeSlug: String,
    repoUrl: String,
    repoName: String,
    repoSummary: String,
    repoTopics: [String],
    repoLanguage: String
  },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  hintsUsed: { type: Number, default: 0 },
  currentCode: { type: String, default: '' },
  currentLanguage: { type: String, default: 'cpp' },
  lastCodeReviewHash: { type: String, default: '' }
}, { timestamps: true });

sessionSchema.index({ userId: 1, status: 1 });

export default mongoose.model('InterviewSession', sessionSchema);
