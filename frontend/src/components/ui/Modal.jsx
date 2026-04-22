import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Transisi ringan: slide-up sederhana, tanpa spring physics berat
const MODAL_TRANSITION = { duration: 0.18, ease: [0.32, 0.72, 0, 1] };

export const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — hanya opacity, tidak ada blur (blur mahal di GPU) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          {/* Modal panel — slide up dari bawah */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={MODAL_TRANSITION}
            className="fixed left-0 right-0 bottom-0 w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl p-6 shadow-xl z-50 border-t border-pink-100 dark:border-slate-800 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">{title}</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
