import mongoose from 'mongoose';

const monthlyBudgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, // Format: "YYYY-MM"
  income: { type: Number, default: 0 },
  keperluan: { type: Number, default: 0 },
  belanja: { type: Number, default: 0 },
}, { timestamps: true });

// Ensure one budget per user per month
monthlyBudgetSchema.index({ user: 1, month: 1 }, { unique: true });

export default mongoose.model('MonthlyBudget', monthlyBudgetSchema);
