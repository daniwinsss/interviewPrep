import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  stats: {
    problemsSolved: { type: Number, default: 0 },
    interviewsCompleted: { type: Number, default: 0 }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
