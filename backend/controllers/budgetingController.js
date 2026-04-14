import MonthlyBudget from '../models/MonthlyBudget.js';

export const getMonthlyBudget = async (req, res) => {
  try {
    const { month } = req.params; // Expect "YYYY-MM"
    let budget = await MonthlyBudget.findOne({ user: req.user._id, month });
    
    if (!budget) {
      budget = new MonthlyBudget({ user: req.user._id, month });
      await budget.save();
    }
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMonthlyBudget = async (req, res) => {
  try {
    const { month } = req.params;
    const { income, keperluan, belanja } = req.body;

    let budget = await MonthlyBudget.findOne({ user: req.user._id, month });
    if (!budget) {
      budget = new MonthlyBudget({ user: req.user._id, month });
    }

    budget.income = Number(income) || 0;
    budget.keperluan = Number(keperluan) || 0;
    budget.belanja = Number(belanja) || 0;

    const updatedBudget = await budget.save();
    res.json(updatedBudget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
