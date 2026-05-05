import express from 'express';
import { resetAllData, inviteToGroup, getGroupMembers, leaveGroup } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/reset').delete(protect, resetAllData);
router.route('/group').get(protect, getGroupMembers);
router.route('/invite').post(protect, inviteToGroup);
router.route('/leave-group').post(protect, leaveGroup);

export default router;
