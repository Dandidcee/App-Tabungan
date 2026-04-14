import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'income'], default: 'deposit' },
  proofOfTransfer: { type: String }, // URL relative or absolute to the uploaded file
  notes: { type: String },
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },
  fundSource: { type: String, enum: ['tabungan_utama', 'gaji', 'keperluan', 'belanja'], default: 'tabungan_utama' }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
