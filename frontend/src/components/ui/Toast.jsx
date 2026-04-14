import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  const iconMap = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-rose-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
  };

  const bgMap = {
    success: 'bg-emerald-50 border-emerald-200',
    error: 'bg-rose-50 border-rose-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const textMap = {
    success: 'text-emerald-800',
    error: 'text-rose-800',
    info: 'text-blue-800',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] min-w-[300px] max-w-[90vw] p-4 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md ${bgMap[type]}`}
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
