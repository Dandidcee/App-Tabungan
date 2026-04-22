import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Delete } from 'lucide-react';

const CalculatorModal = ({ isOpen, onClose }) => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');

  if (!isOpen) return null;

  const handleInput = (val) => {
    // If we just calculated and user types a number, reset expression
    if (expression.includes('=') && !isNaN(val)) {
      setExpression(val);
      setResult(val);
      return;
    }
    // If we just calculated and user types an operator, continue from result
    if (expression.includes('=') && isNaN(val)) {
      setExpression(result.toString() + val);
      return;
    }

    setExpression((prev) => prev + val);
  };

  const handleClear = () => {
    setExpression('');
    setResult('0');
  };

  const handleDelete = () => {
    if (expression.includes('=')) {
      setExpression('');
      setResult('0');
      return;
    }
    setExpression((prev) => prev.slice(0, -1));
  };

  const calculate = () => {
    try {
      if (!expression) return;
      // Note: input is strictly controlled by our UI buttons
      let safeExpression = expression.replace(/x/g, '*').replace(/÷/g, '/');
      
      // Use indirect execution to avoid Vite bundler warnings
      const evaluateFn = new Function('return ' + safeExpression);
      const evaluated = evaluateFn();
      
      // Handle decimals nicely
      const finalResult = Number.isInteger(evaluated) ? evaluated : Number(evaluated.toFixed(4));
      
      setResult(finalResult);
      setExpression(expression + '=');
    } catch (e) {
      setResult('Error');
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden pb-safe"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-gray-700 dark:text-slate-200">Kalkulator</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition">
              <X size={20} />
            </button>
          </div>

          {/* Display */}
          <div className="p-6 bg-gray-50 dark:bg-slate-900 flex flex-col items-end gap-2 min-h-[120px] justify-end">
            <div className="text-gray-400 dark:text-slate-500 min-h-[24px] text-lg font-medium tracking-wider break-all text-right">
              {expression || ' '}
            </div>
            <div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 truncate w-full text-right">
              {result.toLocaleString('id-ID')}
            </div>
          </div>

          {/* Keypad */}
          <div className="p-4 grid grid-cols-4 gap-3 bg-white dark:bg-slate-800">
            <button onClick={handleClear} className="col-span-2 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-2xl font-bold text-lg transition-colors">AC</button>
            <button onClick={handleDelete} className="py-4 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-2xl font-bold text-lg flex justify-center items-center transition-colors"><Delete size={20} /></button>
            <button onClick={() => handleInput('÷')} className="py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-2xl font-bold text-xl transition-colors">÷</button>
            
            <button onClick={() => handleInput('7')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">7</button>
            <button onClick={() => handleInput('8')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">8</button>
            <button onClick={() => handleInput('9')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">9</button>
            <button onClick={() => handleInput('x')} className="py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-2xl font-bold text-xl transition-colors">×</button>
            
            <button onClick={() => handleInput('4')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">4</button>
            <button onClick={() => handleInput('5')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">5</button>
            <button onClick={() => handleInput('6')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">6</button>
            <button onClick={() => handleInput('-')} className="py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-2xl font-bold text-2xl transition-colors">-</button>
            
            <button onClick={() => handleInput('1')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">1</button>
            <button onClick={() => handleInput('2')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">2</button>
            <button onClick={() => handleInput('3')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">3</button>
            <button onClick={() => handleInput('+')} className="py-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-2xl font-bold text-xl transition-colors">+</button>
            
            <button onClick={() => handleInput('0')} className="col-span-2 py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-xl transition-colors">0</button>
            <button onClick={() => handleInput('.')} className="py-4 bg-gray-50 dark:bg-slate-900/50 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-2xl font-bold text-2xl transition-colors">.</button>
            <button onClick={calculate} className="py-4 bg-gradient-to-br from-indigo-400 to-indigo-600 dark:from-indigo-500 dark:to-indigo-700 text-white hover:opacity-90 rounded-2xl font-bold text-2xl transition-opacity shadow-md">=</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CalculatorModal;
