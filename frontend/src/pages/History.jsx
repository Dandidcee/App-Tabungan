import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, PlusCircle, Image as ImageIcon, X } from 'lucide-react';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageModal, setImageModal] = useState(null);
  
  // Form State
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      const [transRes, budgetRes] = await Promise.all([
        api.get('/api/transactions'),
        api.get('/api/budget')
      ]);
      setTransactions(transRes.data.reverse());
      setBudgets(budgetRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let proofOfTransfer = '';
      if (file) {
        const formData = new FormData();
        formData.append('proof', file);
        const uploadRes = await api.post('/api/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        proofOfTransfer = uploadRes.data.filePath;
      }

      await api.post('/api/transactions', {
        amount: Number(amount),
        type,
        budgetId: budgetId || undefined,
        notes,
        proofOfTransfer
      });

      showToast('Transaksi berhasil dicatat!', 'success');
      setIsModalOpen(false);
      
      // Reset Form
      setAmount('');
      setNotes('');
      setFile(null);
      setBudgetId('');
      
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan transaksi', 'error');
    } finally {
      setUploading(false);
    }
  };

  const [filterName, setFilterName] = useState('Semua');

  const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5050';

  // Safely build image URL - avoid double-prepending base URL
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;          // Already full URL
    return `${getApiUrl()}${path}`;                     // Prepend base URL
  };

  const uniqueNames = ['Semua', ...new Set(transactions.map(t => t.user?.name))];
  const filteredTransactions = filterName === 'Semua' 
    ? transactions 
    : transactions.filter(t => t.user?.name === filterName);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">Riwayat Transaksi 📜</h1>
        
        {/* Name Filter Pills - bigger tap target on mobile */}
        <div className="flex flex-wrap gap-2">
          {uniqueNames.map(name => (
            <button
              key={name}
              onClick={() => setFilterName(name)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all min-h-[38px] ${
                filterName === name 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-pink-100 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          {filteredTransactions.length === 0 && (
            <p className="text-center text-gray-500 dark:text-slate-400 py-8">Belum ada transaksi sama sekali.</p>
          )}
          {filteredTransactions.map((trx) => (
            <div key={trx._id} className="flex flex-row justify-between items-center p-3 sm:p-4 hover:bg-pink-50/50 dark:hover:bg-slate-800/50 rounded-2xl transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 gap-2 sm:gap-4">
              <div className="flex items-center gap-3 w-2/3">
                <div className={`p-2 sm:p-3 rounded-2xl flex-shrink-0 ${
                  trx.type === 'deposit' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                  : trx.type === 'income' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
                  : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'
                }`}>
                  {trx.type === 'deposit' ? <TrendingUp size={18} />
                  : trx.type === 'income' ? <PlusCircle size={18} />
                  : <TrendingDown size={18} />}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-800 dark:text-slate-200 text-base truncate">{trx.user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(trx.createdAt).toLocaleString('id-ID', {day:'numeric', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">{trx.notes || '-'}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end flex-shrink-0 w-1/3">
                <p className={`font-bold text-sm sm:text-base ${
                  trx.type === 'deposit' ? 'text-emerald-500'
                  : trx.type === 'income' ? 'text-blue-500'
                  : 'text-rose-500'
                }`}>
                  {trx.type === 'withdrawal' ? '− Rp' : '+ Rp'} {trx.amount.toLocaleString('id-ID')}
                </p>
                <p className="text-right text-[11px] text-gray-500 dark:text-slate-400 font-medium">
                  {trx.type === 'deposit' ? 'Nabung' : trx.type === 'income' ? 'Pemasukan' : 'Pinjam'}
                </p>
                
                {trx.proofOfTransfer && (
                  <button 
                    onClick={() => setImageModal(getImageUrl(trx.proofOfTransfer))}
                    className="flex items-center gap-1 mt-1 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-full min-h-[30px] transition-colors"
                  >
                    <ImageIcon size={13} /> Lihat Bukti
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>


      {/* Image View Modal (No close on click outside for simplicity, just a big X) */}
      <AnimatePresence>
        {imageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl overflow-hidden"
            >
              <button 
                onClick={() => setImageModal(null)} 
                className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 z-10"
              >
                <X size={20} />
              </button>
              <img 
                src={imageModal} 
                alt="Bukti Transfer" 
                className="max-w-full max-h-[80vh] object-contain w-full"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.alt = '❌ Gambar tidak ditemukan / gagal dimuat';
                  e.currentTarget.className = 'hidden';
                  e.currentTarget.nextSibling.classList.remove('hidden');
                }}
              />
              <div className="hidden p-8 text-center text-gray-500">
                <p className="text-lg">❌ Gambar tidak dapat dimuat</p>
                <p className="text-sm mt-1 text-gray-400">File mungkin sudah dihapus dari server</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 text-center border-t dark:border-slate-800">
                <a href={imageModal} target="_blank" rel="noreferrer" className="text-rose-500 font-medium hover:underline inline-block">
                  Buka Gambar di Tab Baru (Download)
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default History;
