import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  // Who owns this notification (null = broadcast to all users)
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Who triggered the action (optional - null = system)
  triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Type of notification
  type: { 
    type: String, 
    enum: ['deposit', 'withdrawal', 'login', 'register', 'activity'], 
    required: true 
  },
  
  // Human-readable message
  message: { type: String, required: true },
  
  // Optional link target (e.g., "history" to navigate to /history)
  linkTo: { type: String, default: null },
  
  // Related transaction ID (if any)
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },

  // Amount (for deposit/withdrawal)
  amount: { type: Number },

  // Which users have READ this notification
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
