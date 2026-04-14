import express from 'express';
import { getBudgets, createBudget } from '../controllers/budgetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getBudgets).post(protect, createBudget);

export default router;
