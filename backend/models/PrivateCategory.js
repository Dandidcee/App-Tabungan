import mongoose from 'mongoose';

const privateCategorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  icon: { type: String, default: '🏷️' }
}, { timestamps: true });

export default mongoose.model('PrivateCategory', privateCategorySchema);
