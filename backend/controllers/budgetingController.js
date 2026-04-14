import PrivateCategory from '../models/PrivateCategory.js';

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
