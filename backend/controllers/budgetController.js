import Budget from '../models/Budget.js';

// GET: Ambil hanya Auto Budgeting milik akun yang login (Privat)
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ createdBy: req.user._id });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createBudget = async (req, res) => {
  try {
    const { title, targetAmount, deadline, icon } = req.body;
    const budget = new Budget({
      title,
      targetAmount,
      deadline,
      icon: icon || '🎯',
      createdBy: req.user._id,
    });
    const createdBudget = await budget.save();
    res.status(201).json(createdBudget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const budget = await Budget.findOne({ _id: id, createdBy: req.user._id });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    // The user requested: uang yang sudah di masukan tidak akan kemanapun melainkan ikut terhapus
    // So we just delete the transactions where budgetId == id
    const Transaction = (await import('../models/Transaction.js')).default;
    await Transaction.deleteMany({ budgetId: id, user: req.user._id });
    
    await Budget.findByIdAndDelete(id);
    
    res.json({ message: 'Target tabungan dan semua riwayat yang masuk ke dalamnya berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
