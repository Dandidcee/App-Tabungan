import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';

const MODAL_TRANSITION = { duration: 0.2, ease: [0.32, 0.72, 0, 1] };

export const Modal = ({ isOpen, onClose, title, children }) => {
  const dragControls = useDragControls();

  return (
    <AnimatePresence>
      {isOpen && [
          /* Backdrop */
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />,
          /* Modal panel */
          <motion.div
            key="modal-panel"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={MODAL_TRANSITION}
            drag="y"
            dragControls={dragControls}
            dragListener={false} // Only drag from the header area to prevent scroll conflicts
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              // If dragged down enough or fast enough, close modal
              if (info.offset.y > 100 || info.velocity.y > 400) {
                onClose();
              }
            }}
            className="fixed left-0 right-0 bottom-0 w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl z-50 flex flex-col max-h-[92vh] border-t border-gray-100 dark:border-slate-800"
          >
            {/* Header / Drag Area */}
            <div 
              className="p-6 pb-4 shrink-0 touch-none cursor-grab active:cursor-grabbing rounded-t-[2rem]"
              onPointerDown={(e) => dragControls.start(e)}
            >
              {/* Drag Pill */}
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-5 shadow-inner" />
              
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100">{title}</h2>
                <button 
                  onClick={onClose} 
                  // Stop propagation so clicking X doesn't trigger drag
                  onPointerDown={(e) => e.stopPropagation()} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-slate-400 transition-colors bg-gray-50 dark:bg-slate-800/50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="px-6 pb-6 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
      ]}
    </AnimatePresence>
  );
};
