export const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-3xl p-6 shadow-md border border-pink-50 ${className}`}>
      {children}
    </div>
  );
};
