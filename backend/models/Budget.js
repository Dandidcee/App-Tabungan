import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date },
  icon: { type: String, default: '🎯' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('Budget', budgetSchema);
