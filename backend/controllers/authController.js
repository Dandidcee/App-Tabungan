import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password });
    if (user) {
      // Notification: new account registered
      await createNotification({
        triggeredBy: user._id,
        type: 'register',
        message: `🎉 Akun baru bergabung: ${user.name} — Selamat datang!`,
        linkTo: null,
      });

      res.status(201).json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      // Notification: login event — visible to all other accounts
      const now = new Date().toLocaleString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
      await createNotification({
        triggeredBy: user._id,
        type: 'login',
        message: `🔐 ${user.name} masuk ke aplikasi (${now})`,
        linkTo: null,
      });

      res.json({ _id: user._id, name: user.name, email: user.email, token: generateToken(user._id) });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
