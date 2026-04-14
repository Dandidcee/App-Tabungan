import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'income', 'allocation'], default: 'deposit' }, // allocation added for transferring
  proofOfTransfer: { type: String }, // URL relative or absolute to the uploaded file
  notes: { type: String },
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget' },
  fundSource: { type: String, default: 'tabungan_utama' } // string can be "tabungan_utama", "gaji", or category ID
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
