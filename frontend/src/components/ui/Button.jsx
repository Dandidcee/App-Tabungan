// Menggunakan button biasa + CSS transform (bukan framer-motion) untuk performa optimal di Android WebView
export const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled, ...props }) => {
  const baseStyle = [
    "inline-flex items-center justify-center gap-2",
    "px-5 py-3 rounded-2xl font-bold text-sm tracking-wide",
    "focus:outline-none",
    "cursor-pointer select-none",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    // GPU-accelerated press effect via CSS
    "transition-[transform,box-shadow,filter] duration-75",
    "will-change-[transform]",
    "active:translate-y-1",
  ].join(' ');

  const variants = {
    primary: [
      "bg-rose-500 text-white",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_5px_0_#9f1239,0_7px_14px_rgba(225,29,72,0.2)]",
      "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0px_0_#9f1239]",
      "hover:brightness-105",
    ].join(' '),
    secondary: [
      "bg-emerald-500 text-white",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_5px_0_#065f46,0_7px_14px_rgba(16,185,129,0.2)]",
      "active:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0px_0_#065f46]",
      "hover:brightness-105",
    ].join(' '),
    outline: [
      "bg-white border-2 border-pink-200 text-rose-500",
      "shadow-[0_4px_0_rgba(225,29,72,0.15),0_6px_12px_rgba(225,29,72,0.08)]",
      "active:shadow-[0_0px_0_rgba(225,29,72,0.1)]",
      "hover:bg-rose-50",
    ].join(' '),
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${variants[variant] ?? variants.primary} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
