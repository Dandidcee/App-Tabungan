import { motion } from 'framer-motion';

export const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', ...props }) => {
  const baseStyle = "px-4 py-2 rounded-full font-semibold focus:outline-none transition-colors shadow-sm";
  const variants = {
    primary: "bg-[var(--color-floral-rose)] text-white hover:bg-rose-600",
    secondary: "bg-[var(--color-floral-mint)] text-emerald-800 hover:bg-emerald-200",
    outline: "border-2 border-[var(--color-floral-rose)] text-rose-600 hover:bg-[var(--color-floral-pink)]",
  };

  return (
    <motion.button
      type={type}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </motion.button>
  );
};
