import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { createNotification } from './notificationController.js';

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ fundSource: 'tabungan_utama' }, { fundSource: { $exists: false } }, { fundSource: null }]
    }).populate('user', 'name email');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBudgetTransactions = async (req, res) => {
  try {
    const { month } = req.params; // YYYY-MM
    // Construct date range for the month
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    const transactions = await Transaction.find({
      user: req.user._id,
      fundSource: { $ne: 'tabungan_utama' },
      createdAt: { $gte: startDate, $lt: endDate }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// All-time private budget/category transactions for history page
export const getAllBudgetTransactions = async (req, res) => {
  try {
    const PrivateCategory = (await import('../models/PrivateCategory.js')).default;

    // Get all transactions that are NOT tabungan_utama (gaji or category-based)
    const transactions = await Transaction.find({
      user: req.user._id,
      fundSource: { $nin: ['tabungan_utama', null] }
    }).populate('user', 'name email').sort({ createdAt: -1 });

    // Get all categories to enrich transaction data with category names
    const categories = await PrivateCategory.find({ user: req.user._id });
    const categoryMap = {};
    categories.forEach(c => { categoryMap[c._id.toString()] = c; });

    const enriched = transactions.map(t => {
      const catId = t.fundSource;
      const cat = categoryMap[catId];
      return {
        ...t.toObject(),
        categoryName: cat?.name || (t.fundSource === 'gaji' ? '💼 Saldo Gaji' : t.fundSource),
        categoryIcon: cat?.icon || (t.fundSource === 'gaji' ? '💼' : '📁'),
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { amount, type, notes, budgetId, proofOfTransfer, fundSource, toCategory } = req.body;

    // --- NEW: Insufficient Balance Validation ---
    if (type === 'withdrawal' || type === 'allocation') {
      let balance = 0;
      const actualSource = fundSource || 'tabungan_utama';
      
      if (actualSource === 'tabungan_utama') {
        if (budgetId) {
          const budget = await Budget.findById(budgetId);
          balance = budget ? budget.currentAmount : 0;
        } else {
          const publicTx = await Transaction.find({
            $or: [{ fundSource: 'tabungan_utama' }, { fundSource: { $exists: false } }, { fundSource: null }]
          });
          balance = publicTx.reduce((acc, t) => {
            if (t.type === 'deposit' || t.type === 'income') return acc + t.amount;
            if (t.type === 'withdrawal') return acc - t.amount;
            return acc;
          }, 0);
        }
      } else {
        const privateTx = await Transaction.find({ user: req.user._id, fundSource: actualSource });
        balance = privateTx.reduce((acc, t) => {
          if (t.type === 'deposit' || t.type === 'income') return acc + t.amount;
          if (t.type === 'withdrawal' || t.type === 'allocation') return acc - t.amount;
          return acc;
        }, 0);
      }

      if (Number(amount) > balance) {
        return res.status(400).json({ message: `Gagal! Saldo Anda tidak cukup (Sisa: Rp ${balance.toLocaleString('id-ID')}).` });
      }
    }

    if (type === 'allocation') {
      // Create double entry for Envelope Budgeting
      const withdrawalTx = new Transaction({
        user: req.user._id,
        amount,
        type: 'withdrawal',
        notes: notes || 'Alokasi ke Kategori',
        fundSource: fundSource || 'gaji'
      });
      await withdrawalTx.save();

      const incomeTx = new Transaction({
        user: req.user._id,
        amount,
        type: 'income',
        notes: notes || 'Penerimaan Alokasi',
        fundSource: toCategory
      });
      const createdAllocation = await incomeTx.save();
      return res.status(201).json(createdAllocation);
    }

    const transaction = new Transaction({
      user: req.user._id,
      amount,
      type,
      notes,
      budgetId,
      proofOfTransfer,
      fundSource: fundSource || 'tabungan_utama'
    });

    const createdTransaction = await transaction.save();

    // income & deposit both ADD to budget, withdrawal SUBTRACTS
    if (budgetId && (type === 'deposit' || type === 'income')) {
      const budget = await Budget.findById(budgetId);
      if (budget) {
        budget.currentAmount += Number(amount);
        await budget.save();
      }
    } else if (budgetId && type === 'withdrawal') {
      const budget = await Budget.findById(budgetId);
      if (budget) {
        budget.currentAmount -= Number(amount);
        await budget.save();
      }
    }

    // === Auto-create notification for all users ONLY IF public ===
    const isPublic = transaction.fundSource === 'tabungan_utama';
    const formattedAmount = Number(amount).toLocaleString('id-ID');
    const userName = req.user.name;

    if (isPublic) {
      if (type === 'deposit') {
        await createNotification({
          triggeredBy: req.user._id,
          type: 'deposit',
          message: `💰 ${userName} menabung Rp ${formattedAmount}${notes ? ` — "${notes}"` : ''}`,
          linkTo: '/history',
          transactionId: createdTransaction._id,
          amount: Number(amount),
        });
      } else if (type === 'income') {
        await createNotification({
          triggeredBy: req.user._id,
          type: 'deposit',
          message: `🎉 ${userName} pemasukan tambahan Rp ${formattedAmount}${notes ? ` — "${notes}"` : ''}`,
          linkTo: '/history',
          transactionId: createdTransaction._id,
          amount: Number(amount),
        });
      } else if (type === 'withdrawal') {
        await createNotification({
          triggeredBy: req.user._id,
          type: 'withdrawal',
          message: `💸 ${userName} meminjam Rp ${formattedAmount}${notes ? ` — "${notes}"` : ''}`,
          linkTo: '/history',
          transactionId: createdTransaction._id,
          amount: Number(amount),
        });
      }
    }

    res.status(201).json(createdTransaction);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: error.message });
    }
  }
};
