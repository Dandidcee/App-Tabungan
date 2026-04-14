import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Image as ImageIcon, X } from 'lucide-react';

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

  const uniqueNames = ['Semua', ...new Set(transactions.map(t => t.user?.name))];
  const filteredTransactions = filterName === 'Semua' 
    ? transactions 
    : transactions.filter(t => t.user?.name === filterName);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Riwayat Transaksi 📜</h1>
        
        {/* Name Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {uniqueNames.map(name => (
            <button
              key={name}
              onClick={() => setFilterName(name)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterName === name 
                  ? 'bg-rose-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-pink-100 hover:bg-rose-50'
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
            <p className="text-center text-gray-500 py-8">Belum ada transaksi sama sekali.</p>
          )}
          {filteredTransactions.map((trx) => (
            <div key={trx._id} className="flex flex-row justify-between items-center p-3 sm:p-4 hover:bg-pink-50/50 rounded-2xl transition-colors border-b border-gray-50 last:border-0 gap-2 sm:gap-4">
              <div className="flex items-center gap-3 w-2/3">
                <div className={`p-2 sm:p-3 rounded-2xl flex-shrink-0 ${trx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {trx.type === 'deposit' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-gray-800 text-base truncate">{trx.user.name}</p>
                  <p className="text-xs text-gray-500">{new Date(trx.createdAt).toLocaleString('id-ID', {day:'numeric', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{trx.notes || '-'}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end flex-shrink-0 w-1/3">
                <p className={`font-bold text-sm sm:text-base ${trx.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {trx.type === 'deposit' ? '+ Rp' : '- Rp'} {trx.amount.toLocaleString('id-ID')}
                </p>
                <p className="text-right text-[11px] text-gray-500 font-medium">
                  {trx.type === 'deposit' ? 'Nabung' : 'Pinjam'}
                </p>
                
                {trx.proofOfTransfer && (
                  <button 
                    onClick={() => setImageModal(`${getApiUrl()}${trx.proofOfTransfer}`)}
                    className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1 rounded-full"
                  >
                    <ImageIcon size={14} /> Lihat Bukti
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
              className="relative max-w-3xl max-h-[90vh] bg-white rounded-xl overflow-hidden"
            >
              <button 
                onClick={() => setImageModal(null)} 
                className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-1 shadow-md hover:bg-rose-600 z-10"
              >
                <X size={20} />
              </button>
              <img src={imageModal} alt="Bukti Transfer" className="max-w-full max-h-[85vh] object-contain" />
              <div className="p-3 bg-white text-center border-t">
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
