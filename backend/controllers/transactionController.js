import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { createNotification } from './notificationController.js';

export const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({}).populate('user', 'name email');
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { amount, type, notes, budgetId, proofOfTransfer } = req.body;

    const transaction = new Transaction({
      user: req.user._id,
      amount,
      type,
      notes,
      budgetId,
      proofOfTransfer
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

    // === Auto-create notification for all users ===
    const formattedAmount = Number(amount).toLocaleString('id-ID');
    const userName = req.user.name;

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

    res.status(201).json(createdTransaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
