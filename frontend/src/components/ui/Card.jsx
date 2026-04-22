export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800
      shadow-[0_2px_0_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.07)]
      dark:shadow-[0_2px_0_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.3)]
      ${className}`}>
      {children}
    </div>
  );
};
