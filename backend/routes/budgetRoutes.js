import express from 'express';
import { getBudgets, createBudget, deleteBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getBudgets).post(protect, createBudget);
router.route('/:id').delete(protect, deleteBudget);

export default router;
