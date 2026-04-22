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
      "bg-gradient-to-b from-rose-300 to-rose-500 text-white",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_0_#be123c,0_8px_16px_rgba(225,29,72,0.3)]",
      "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0px_0_#be123c] active:translate-y-1",
      "hover:brightness-110",
    ].join(' '),
    secondary: [
      "bg-gradient-to-b from-emerald-300 to-emerald-500 text-white",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_0_#047857,0_8px_16px_rgba(16,185,129,0.3)]",
      "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0px_0_#047857] active:translate-y-1",
      "hover:brightness-110",
    ].join(' '),
    outline: [
      "bg-white border-2 border-rose-400 text-rose-500",
      "shadow-[0_6px_0_rgba(225,29,72,0.2),0_8px_16px_rgba(225,29,72,0.15)]",
      "active:shadow-[0_0px_0_rgba(225,29,72,0.15)] active:translate-y-1",
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
