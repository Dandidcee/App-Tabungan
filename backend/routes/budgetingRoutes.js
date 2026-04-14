import express from 'express';
import { getMonthlyBudget, updateMonthlyBudget } from '../controllers/budgetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/:month').get(protect, getMonthlyBudget).post(protect, updateMonthlyBudget);

export default router;
