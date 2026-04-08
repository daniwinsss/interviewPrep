import mongoose from 'mongoose';

const mcqSchema = new mongoose.Schema({
  subject: { type: String, enum: ['OS', 'DBMS', 'CN', 'OOPS'], required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true }, // Index of the correct option
  explanation: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('MCQ', mcqSchema);
