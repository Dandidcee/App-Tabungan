import Notification from '../models/Notification.js';

// GET /api/notifications - Get all notifications for the logged-in user
// Returns notifications with read status per-user
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: { $in: [req.user._id, null] }
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('triggeredBy', 'name email');

    // Map to include per-user read status
    const mapped = notifications.map(n => ({
      _id: n._id,
      type: n.type,
      message: n.message,
      linkTo: n.linkTo,
      amount: n.amount,
      transactionId: n.transactionId,
      triggeredBy: n.triggeredBy,
      read: n.readBy.some(id => id.toString() === req.user._id.toString()),
      createdAt: n.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/notifications/read-all - Mark all as read for this user
export const markAllRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Add userId to readBy for all unread notifications
    await Notification.updateMany(
      { readBy: { $ne: userId }, userId: { $in: [userId, null] } },
      { $addToSet: { readBy: userId } }
    );

    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/notifications - Clear all notifications (admin-style, clears for everyone)
export const clearAll = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: { $in: [req.user._id, null] } });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Internal helper - called from other controllers to create a notification
export const createNotification = async ({ userId, triggeredBy, type, message, linkTo, transactionId, amount }) => {
  try {
    await Notification.create({
      userId: userId || null,
      triggeredBy,
      type,
      message,
      linkTo: linkTo || null,
      transactionId: transactionId || null,
      amount: amount || null,
      readBy: triggeredBy ? [triggeredBy] : [], // Auto-mark as read for the person who triggered it
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
  }
};

// GET /api/notifications/unread-count - Get count of unread for badge
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ 
      readBy: { $ne: userId }, 
      userId: { $in: [userId, null] } 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
