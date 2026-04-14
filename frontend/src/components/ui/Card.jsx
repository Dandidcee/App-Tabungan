export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-pink-50 dark:border-slate-800 ${className}`}>
      {children}
    </div>
  );
};
