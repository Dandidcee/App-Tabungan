import { motion } from 'framer-motion';

export const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled, ...props }) => {
  const baseStyle = [
    "inline-flex items-center justify-center gap-2",
    "px-5 py-2.5 rounded-full font-bold text-sm",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "transition-all duration-200 ease-out",
    "cursor-pointer select-none",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  ].join(' ');

  const variants = {
    primary: [
      "bg-gradient-to-r from-rose-500 to-pink-500 text-white",
      "shadow-[0_4px_15px_rgba(225,29,72,0.4)]",
      "hover:shadow-[0_6px_20px_rgba(225,29,72,0.55)]",
      "hover:from-rose-400 hover:to-pink-400",
      "focus:ring-rose-400",
      "active:shadow-[0_2px_8px_rgba(225,29,72,0.3)]",
    ].join(' '),
    secondary: [
      "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
      "shadow-[0_4px_15px_rgba(16,185,129,0.4)]",
      "hover:shadow-[0_6px_20px_rgba(16,185,129,0.55)]",
      "hover:from-emerald-400 hover:to-teal-400",
      "focus:ring-emerald-400",
    ].join(' '),
    outline: [
      "bg-transparent border-2 border-rose-400 text-rose-500",
      "dark:border-rose-500 dark:text-rose-400",
      "hover:bg-rose-500 hover:text-white hover:border-rose-500",
      "dark:hover:bg-rose-500 dark:hover:text-white",
      "shadow-[0_2px_8px_rgba(225,29,72,0.15)]",
      "hover:shadow-[0_4px_15px_rgba(225,29,72,0.35)]",
      "focus:ring-rose-400",
    ].join(' '),
  };

  return (
    <motion.button
      type={type}
      whileHover={!disabled ? { scale: 1.04, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.96, y: 0 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`${baseStyle} ${variants[variant] ?? variants.primary} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};
