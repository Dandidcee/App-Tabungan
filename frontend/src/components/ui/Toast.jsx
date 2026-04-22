import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const iconMap = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const bgMap = {
    success: 'bg-white border-emerald-200',
    error: 'bg-white border-rose-200',
    info: 'bg-white border-blue-200',
  };

  const textMap = {
    success: 'text-emerald-800',
    error: 'text-rose-800',
    info: 'text-blue-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`fixed top-4 left-4 right-4 z-[9999] max-w-sm mx-auto p-4 rounded-2xl border shadow-lg flex items-center gap-3 ${bgMap[type]}`}
    >
      <div className="shrink-0">{iconMap[type]}</div>
      <p className={`flex-1 font-bold text-sm ${textMap[type]}`}>{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors text-gray-400">
        <X size={16} />
      </button>
    </motion.div>
  );
};

export default Toast;
