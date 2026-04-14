import Budget from '../models/Budget.js';

export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({});
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const { title, targetAmount, deadline } = req.body;
    const budget = new Budget({
      title,
      targetAmount,
      deadline,
      createdBy: req.user._id,
    });
    const createdBudget = await budget.save();
    res.status(201).json(createdBudget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
