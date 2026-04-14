import express from 'express';
import { getNotifications, markAllRead, clearAll, getUnreadCount } from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.get('/unread-count', protect, getUnreadCount);
router.patch('/read-all', protect, markAllRead);
router.delete('/', protect, clearAll);

export default router;
