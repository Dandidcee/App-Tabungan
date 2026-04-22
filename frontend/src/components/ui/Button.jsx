import { motion } from 'framer-motion';

export const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled, ...props }) => {
  const baseStyle = [
    "inline-flex items-center justify-center gap-2",
    "px-5 py-2.5 rounded-full font-extrabold text-sm tracking-wide",
    "focus:outline-none",
    "cursor-pointer select-none relative",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  ].join(' ');

  const variants = {
    primary: [
      "bg-gradient-to-b from-rose-400 to-rose-600 text-white",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_0_#9f0d2c,0_8px_16px_rgba(225,29,72,0.4)]",
      "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0px_0_#9f0d2c] active:translate-y-1",
      "hover:brightness-110",
    ].join(' '),
    secondary: [
      "bg-gradient-to-b from-emerald-400 to-emerald-600 text-white",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_0_#065f46,0_8px_16px_rgba(5,150,105,0.4)]",
      "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0px_0_#065f46] active:translate-y-1",
      "hover:brightness-110",
    ].join(' '),
    outline: [
      "bg-white border-2 border-rose-500 text-rose-600",
      "shadow-[0_6px_0_rgba(225,29,72,0.25),0_8px_16px_rgba(225,29,72,0.15)]",
      "active:shadow-[0_0px_0_rgba(225,29,72,0.2)] active:translate-y-1",
      "hover:bg-rose-50",
    ].join(' '),
  };

  return (
    <motion.button
      type={type}
      whileTap={!disabled ? { y: 4 } : {}}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={`${baseStyle} ${variants[variant] ?? variants.primary} transition-[filter,box-shadow] duration-100 ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
};
