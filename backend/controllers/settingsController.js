import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import Budget from '../models/Budget.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const resetAllData = async (req, res) => {
  try {
    // 1. Delete all transactions
    await Transaction.deleteMany({});
    
    // 2. Delete all notifications
    await Notification.deleteMany({});
    
    // 3. Reset all main budget balances to 0, instead of deleting the budget target itself
    await Budget.updateMany({}, { currentAmount: 0 });

    // 4. (Optional) Delete all dynamically created envelope budget categories later
    // We will do this when PrivateCategory model is created

    // 5. Clean /uploads folder
    const uploadsDir = path.join(__dirname, '../uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    }

    res.json({ message: 'Semua data transaksi, notifikasi, dan file gambar berhasil dihapus secara permanen.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
