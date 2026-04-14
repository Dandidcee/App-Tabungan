import express from 'express';
import { resetAllData } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/reset').delete(protect, resetAllData);

export default router;
