import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import Budget from '../models/Budget.js';
import User from '../models/User.js';

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

export const inviteToGroup = async (req, res) => {
  try {
    const { email } = req.body;
    const targetUser = await User.findOne({ email });
    
    if (!targetUser) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
    }
    
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Tidak bisa mengundang diri sendiri' });
    }

    const myGroupId = req.user.tabunganGroupId || req.user._id.toString();
    
    // Assign the target user to my group
    targetUser.tabunganGroupId = myGroupId;
    await targetUser.save();

    // Ensure I also explicitly have the groupId saved (for older users)
    if (!req.user.tabunganGroupId) {
      await User.findByIdAndUpdate(req.user._id, { tabunganGroupId: myGroupId });
    }

    res.json({ message: `${targetUser.name} berhasil ditambahkan ke grup Tabungan Bersama Anda!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroupMembers = async (req, res) => {
  try {
    const myGroupId = req.user.tabunganGroupId || req.user._id.toString();
    const members = await User.find({
      $or: [{ _id: myGroupId }, { tabunganGroupId: myGroupId }]
    }).select('name email profilePicture tabunganGroupId');
    
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    // Reset to their own ID
    const user = await User.findById(req.user._id);
    user.tabunganGroupId = user._id.toString();
    await user.save();
    
    res.json({ message: 'Berhasil keluar dari grup Tabungan Bersama' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

