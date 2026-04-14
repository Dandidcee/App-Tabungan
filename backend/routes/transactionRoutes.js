import express from 'express';
import { getTransactions, createTransaction, getBudgetTransactions, getAllBudgetTransactions } from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getTransactions).post(protect, createTransaction);
router.route('/budget/:month').get(protect, getBudgetTransactions);
router.route('/budget-all').get(protect, getAllBudgetTransactions);

export default router;
