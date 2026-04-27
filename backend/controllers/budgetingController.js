import PrivateCategory from '../models/PrivateCategory.js';

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon } = req.body;

    const category = await PrivateCategory.findOne({ _id: id, user: req.user._id });
    if (!category) return res.status(404).json({ message: 'Kategori tidak ditemukan' });

    if (name) category.name = name;
    if (icon) category.icon = icon;
    const updated = await category.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await PrivateCategory.find({ user: req.user._id });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, icon } = req.body;
    const category = new PrivateCategory({ user: req.user._id, name, icon });
    const created = await category.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check category ownership
    const category = await PrivateCategory.findOne({ _id: id, user: req.user._id });
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Calculate remaining balance before deletion
    const Transaction = (await import('../models/Transaction.js')).default;
    const categoryTxs = await Transaction.find({ fundSource: id, user: req.user._id });
    const balance = categoryTxs.reduce((acc, t) => {
      if (t.type === 'deposit' || t.type === 'income') return acc + t.amount;
      if (t.type === 'withdrawal' || t.type === 'allocation') return acc - t.amount;
      return acc;
    }, 0);

    // Return to Gaji if there is a remaining balance
    if (balance > 0) {
       const returnTx = new Transaction({
         user: req.user._id,
         amount: balance,
         type: 'income',
         fundSource: 'gaji',
         notes: `Pengembalian sisa saldo dari kategori ${category.name}`
       });
       await returnTx.save();
    }

    // Now safely delete the category and all its associated transactions
    await PrivateCategory.findByIdAndDelete(id);
    await Transaction.deleteMany({ fundSource: id, user: req.user._id });

    res.json({ message: 'Kategori dihapus dan sisa saldo dikembalikan ke Gaji' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
