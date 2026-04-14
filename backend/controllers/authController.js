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

      res.status(201).json({ 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        emoji: user.emoji,
        profilePicture: user.profilePicture,
        token: generateToken(user._id) 
      });
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

      res.json({ 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        emoji: user.emoji,
        profilePicture: user.profilePicture,
        token: generateToken(user._id) 
      });
    } else {
      // Custom Error logic as requested
      if (!user) {
        return res.status(401).json({ message: 'Akun tidak terdaftar' });
      } else {
        return res.status(401).json({ message: 'Password anda salah' });
      }
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      if (req.body.emoji !== undefined) user.emoji = req.body.emoji;
      if (req.body.profilePicture !== undefined) user.profilePicture = req.body.profilePicture;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        emoji: updatedUser.emoji,
        profilePicture: updatedUser.profilePicture,
        token: generateToken(updatedUser._id), // Optionally regenerate token or use the old one (both work)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        emoji: user.emoji,
        profilePicture: user.profilePicture,
        token: req.headers.authorization.split(' ')[1] // Keep the current token
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
