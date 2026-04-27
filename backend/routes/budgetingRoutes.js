import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/budgetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/categories').get(protect, getCategories).post(protect, createCategory);
router.route('/categories/:id').put(protect, updateCategory).delete(protect, deleteCategory);

export default router;
