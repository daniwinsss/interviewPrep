import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  round: {
    type: String,
    enum: ['dsa', 'system_design', 'behavioural', 'project', 'core_cs'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{ type: String }],
  title: { type: String, required: true },
  content: { type: String, required: true },
  phases: [{ type: String }],
  constraints: { type: String, default: '' },
  examples: { type: String, default: '' },
  scaleHints: { type: String, default: '' },
  lpPrinciples: [{ type: String }],
  solution: {
    approach: { type: String, default: '' },
    tc: { type: String, default: '' },
    sc: { type: String, default: '' },
    code: { type: String, default: '' }
  },
  source: {
    type: String,
    enum: ['striver', 'usaco', 'llm', 'custom'],
    default: 'custom'
  },
  leetcodeSlug: {
    type: String,
    default: null
  }
}, { timestamps: true });

questionSchema.index({ round: 1, difficulty: 1, tags: 1 });

export default mongoose.model('InterviewQuestion', questionSchema);
