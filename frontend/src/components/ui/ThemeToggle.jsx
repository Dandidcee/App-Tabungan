import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const ThemeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.1 }}
      onClick={toggleDarkMode}
      className={`relative p-2 rounded-full transition-colors ${
        isDarkMode 
          ? 'bg-slate-800 text-yellow-400 border border-slate-700' 
          : 'bg-rose-50 text-rose-500 border border-pink-100'
      }`}
      aria-label="Toggle Dark Mode"
    >
      {isDarkMode ? (
        <Sun size={20} className="fill-yellow-400" />
      ) : (
        <Moon size={20} className="fill-rose-500" />
      )}
    </motion.button>
  );
};

export default ThemeToggle;
