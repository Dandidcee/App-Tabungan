import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowDownToLine, ArrowUpFromLine, PlusCircle, Activity, ChevronDown, Image as ImageIcon, X, ArrowRight, Settings, Wallet, ShoppingBag, Coffee, Plus, AlertTriangle, RefreshCcw } from 'lucide-react';

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5050';
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getApiUrl()}${path}`;
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalTabungan, setTotalTabungan] = useState(0);
  const [uangKeluar, setUangKeluar] = useState(0);
  const [imageModal, setImageModal] = useState(null);
  
  // Auto Budgeting State (Envelope)
  const [categories, setCategories] = useState([]);
  const [budgetTransactions, setBudgetTransactions] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('🏷️');

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [fundSource, setFundSource] = useState('tabungan_utama');
  const [toCategory, setToCategory] = useState(''); // for allocation type
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  
  // Reset Confirmation State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Category Deletion State
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const { showToast } = useToast();
  const prevDataRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const monthStr = new Date().toISOString().substring(0, 7);
      const [budgetsRes, transactionsRes, catsRes, budgetTxRes] = await Promise.all([
        api.get('/api/budget'),
        api.get('/api/transactions'),
        api.get('/api/budgeting/categories'),
        api.get(`/api/transactions/budget/${monthStr}`),
      ]);
      const allTx = transactionsRes.data;

      const newSignature = JSON.stringify({
        txIds: allTx.map(t => t._id + t.amount).join(','),
        budgetAmounts: budgetsRes.data.map(b => b._id + b.currentAmount).join(','),
        cats: catsRes.data.map(c => c._id).join(','),
        budgetTxs: budgetTxRes.data.map(t => t._id).join(',')
      });

      if (prevDataRef.current === newSignature) return;
      prevDataRef.current = newSignature;

      const deposits = allTx.filter(t => (t.type === 'deposit' || t.type === 'income') && !t.budgetId).reduce((a, c) => a + c.amount, 0);
      const withdrawals = allTx.filter(t => t.type === 'withdrawal' && !t.budgetId).reduce((a, c) => a + c.amount, 0);
      
      setTotalTabungan(deposits - withdrawals);
      setUangKeluar(withdrawals);
      setBudgets(budgetsRes.data);
      setTransactions(allTx.reverse().slice(0, 5));
      
      setCategories(catsRes.data);
      setBudgetTransactions(budgetTxRes.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const openTransactionModal = (txType, overrideSource = 'tabungan_utama', overrideToCat = '') => {
    setType(txType);
    setFundSource(overrideSource);
    setToCategory(overrideToCat);
    setIsModalOpen(true);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      let proofOfTransfer = '';
      if (file) {
        const formData = new FormData();
        formData.append('proof', file);
        const uploadRes = await api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        proofOfTransfer = uploadRes.data.filePath;
      }

      await api.post('/api/transactions', {
        amount: Number(amount),
        type,
        budgetId: (fundSource === 'tabungan_utama' && budgetId) ? budgetId : undefined,
        fundSource,
        toCategory,
        notes,
        proofOfTransfer
      });

      const msg = type === 'deposit' ? 'Berhasil nabung.' : type === 'income' ? 'Pemasukan dicatat!' : type === 'allocation' ? 'Alokasi berhasil disedot.' : 'Pinjaman dicatat.';
      showToast(msg, 'success');
      setIsModalOpen(false);
      setAmount(''); setNotes(''); setBudgetId(''); setFundSource('tabungan_utama'); setToCategory(''); setFile(null); setIsSelectOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan transaksi', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/budgeting/categories', { name: categoryName, icon: categoryIcon });
      showToast('Kategori baru berhasil dicetak!', 'success');
      setIsCategoryModalOpen(false);
      setCategoryName('');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal membuat kategori', 'error');
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await api.delete('/api/settings/reset');
      showToast('Sistem barusan di-reset bersih!', 'success');
      setIsResetModalOpen(false);
      prevDataRef.current = null;
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mereset data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const promptDeleteCategory = (id, name) => {
    setCategoryToDelete({ id, name });
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await api.delete(`/api/budgeting/categories/${categoryToDelete.id}`);
      showToast(`Budget ${categoryToDelete.name} berhasil dihapus!`, 'success');
      setCategoryToDelete(null);
      fetchData();
    } catch (err) {
      showToast('Gagal menghapus budget', 'error');
    }
  };

  // Envelopes logic
  const gajiTx = budgetTransactions.filter(t => t.fundSource === 'gaji');
  const gajiBalance = gajiTx.reduce((acc, t) => {
    if (t.type === 'deposit' || t.type === 'income') return acc + t.amount;
    if (t.type === 'withdrawal' || t.type === 'allocation') return acc - t.amount;
    return acc;
  }, 0);

  const getEnvelopeBalance = (catId) => {
    const envTxs = budgetTransactions.filter(t => t.fundSource === catId);
    return envTxs.reduce((acc, t) => {
      if (t.type === 'deposit' || t.type === 'income') return acc + t.amount;
      if (t.type === 'withdrawal' || t.type === 'allocation') return acc - t.amount;
      return acc;
    }, 0);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-24 md:pb-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 md:gap-4">
          {user?.profilePicture && (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-rose-50 shrink-0 hidden sm:block">
              <img src={getImageUrl(user.profilePicture)} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Halo, {user?.name} {user?.emoji || '👋'}</h1>
            <p className="italic text-sm md:text-base text-gray-500 mt-0.5">semangat nabungnya ya</p>
          </div>
        </div>
        
        {/* DANGER ZONE RESET BUTTON */}
        <button 
          onClick={() => setIsResetModalOpen(true)} 
          className="text-rose-500 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 hover:bg-rose-100 transition-colors shadow-sm flex items-center gap-2 group"
          title="Reset Keseluruhan (Danger Zone)"
        >
           <AlertTriangle size={18} className="group-hover:rotate-12 transition-transform" />
           <span className="text-xs font-bold hidden sm:block">Reset Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 text-white border-none relative overflow-hidden shadow-pink-200 shadow-xl">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <p className="text-pink-100 font-medium opacity-90 text-sm tracking-wide uppercase">Tabungan Pernikahan</p>
              <h2 className="text-4xl md:text-5xl font-extrabold mt-3 tracking-tight">Rp {totalTabungan.toLocaleString('id-ID')}</h2>
            </div>
            <div className="mt-8 flex justify-between items-end">
              <div>
                <p className="text-xs text-pink-100 font-medium">Uang di Pinjam atau di Luar</p>
                <p className="text-lg font-bold">Rp {uangKeluar.toLocaleString('id-ID')}</p>
              </div>
              <p className="text-sm text-pink-100 italic">"Satu langkah lebih dekat."</p>
            </div>
          </div>
          <Heart size={200} className="absolute -right-10 -bottom-10 text-white/10" />
        </Card>

        {/* Quick Actions */}
        <div className="col-span-1 flex flex-col gap-3">
          <div className="flex flex-row md:flex-col gap-3 flex-1">
            <button onClick={() => openTransactionModal('deposit')} className="flex-1 glass bg-white/60 hover:bg-white/90 transition-all rounded-3xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-sm border border-emerald-100 group">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-1.5 md:mb-2 group-hover:scale-110 shadow-sm border border-white transition-transform">
                    <ArrowDownToLine size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm md:text-base">Nabung</h3>
            </button>

            <button onClick={() => openTransactionModal('withdrawal')} className="flex-1 glass bg-white/60 hover:bg-white/90 transition-all rounded-3xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-sm border border-rose-100 group">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-100 to-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-1.5 md:mb-2 group-hover:scale-110 shadow-sm border border-white transition-transform">
                    <ArrowUpFromLine size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm md:text-base">Pinjam/Pakai</h3>
            </button>
          </div>

          <button onClick={() => openTransactionModal('income')} className="glass bg-white/60 hover:bg-white/90 transition-all rounded-3xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-sm border border-blue-100 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-1.5 md:mb-2 group-hover:scale-110 shadow-sm border border-white transition-transform">
                  <PlusCircle size={20} />
              </div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base">Pemasukan</h3>
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-100 via-purple-50 to-purple-200 backdrop-blur-xl rounded-3xl shadow-lg border-2 border-white/80 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="bg-white/50 backdrop-blur-md border-b border-white/60 px-5 py-4 flex items-center justify-between relative z-10 flex-wrap gap-3">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="text-indigo-500" size={20} /> Budget Bulanan
          </h3>
          <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-indigo-100 px-3 py-1.5 rounded-full text-indigo-600 hover:bg-indigo-50 hover:shadow-sm transition-all shadow-sm">
            <Plus size={14} /> Kategori Baru
          </button>
        </div>
        
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 relative z-10">
          {/* MASTER POOL: DOMPET GAJI */}
          <div className="md:col-span-1 border-r-0 md:border-r border-indigo-100/50 pr-0 md:pr-5 mb-4 md:mb-0">
             <div className="flex flex-col h-full items-center p-5 bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 rounded-2xl shadow-md text-white/90 relative overflow-hidden group">
                <Heart size={150} className="absolute -right-8 -bottom-8 text-white/10 pointer-events-none" />
                <div className="relative z-10 text-center flex flex-col items-center h-full w-full">
                  <div className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-0.5 rounded-full mb-3 shadow-inner">SUMBER DANA</div>
                  <Wallet size={40} className="mb-2 opacity-90 text-white" />
                  <p className="text-rose-100 text-xs font-medium uppercase tracking-widest mt-1">Dompet Gaji</p>
                  <h4 className="font-extrabold text-2xl tracking-tight text-white mt-1 mb-auto">Rp {gajiBalance.toLocaleString('id-ID')}</h4>
                  
                  <div className="w-full mt-4 flex gap-2">
                     <button onClick={() => openTransactionModal('deposit', 'gaji')} className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors py-2 rounded-xl text-xs font-bold shadow-sm text-white">
                        + Tambah
                     </button>
                     <button onClick={() => openTransactionModal('withdrawal', 'gaji')} className="flex-1 bg-black/10 hover:bg-black/20 backdrop-blur-sm transition-colors py-2 rounded-xl text-xs font-bold shadow-sm text-white">
                        - Pakai
                     </button>
                  </div>
                </div>
             </div>
          </div>

          {/* DYNAMIC ENVELOPES */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
             {categories.length === 0 && (
                <div className="col-span-full border-2 border-dashed border-indigo-200/50 rounded-2xl p-6 flex flex-col items-center justify-center text-indigo-400 group cursor-pointer hover:bg-indigo-50/30 transition-colors" onClick={() => setIsCategoryModalOpen(true)}>
                   <PlusCircle size={30} className="mb-2 opacity-50 group-hover:opacity-100 transition-opacity" />
                   <p className="text-sm font-semibold">Buat Amplop Kategori</p>
                   <p className="text-[10px] opacity-70 mt-1">Misal: Keperluan, Belanja, Cicilan Motor</p>
                </div>
             )}

             {categories.map(cat => {
               const bal = getEnvelopeBalance(cat._id);
               return (
                 <div key={cat._id} className="flex flex-col items-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <button onClick={() => promptDeleteCategory(cat._id, cat.name)} className="absolute top-2 right-2 text-rose-300 hover:text-rose-600 transition-colors p-1" title="Reset/Hapus Budget ini">
                      <X size={15} />
                    </button>
                    <p className="text-3xl mb-1 mt-2 group-hover:scale-110 transition-transform">{cat.icon}</p>
                    <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest mt-1">{cat.name}</p>
                    <h4 className="font-extrabold text-xl text-gray-800 tracking-tight mt-1 mb-auto">Rp {bal.toLocaleString('id-ID')}</h4>
                    
                    <div className="w-full mt-4 flex gap-1.5 pt-3 border-t border-indigo-50/50">
                       <button onClick={() => openTransactionModal('allocation', 'gaji', cat._id)} className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-1.5 rounded-lg transition-colors">
                          <ArrowDownToLine size={14} className="mb-0.5" /> Sedot Gaji
                       </button>
                       <button onClick={() => openTransactionModal('withdrawal', cat._id)} className="flex-1 flex flex-col items-center justify-center text-[10px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-100 py-1.5 rounded-lg transition-colors">
                          <ArrowUpFromLine size={14} className="mb-0.5" /> Pakai
                       </button>
                    </div>
                 </div>
               );
             })}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-rose-100 via-pink-50 to-pink-200 backdrop-blur-xl rounded-3xl shadow-lg border-2 border-white/80 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-300/30 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="bg-white/50 backdrop-blur-md border-b border-white/60 px-5 py-4 flex items-center justify-between relative z-10">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-rose-400" size={20} /> Transaksi Publik Terakhir
          </h3>
          <button onClick={() => navigate('/history')} className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white/60 border border-rose-100 px-3 py-1.5 rounded-full transition-all hover:shadow-sm">
            Lihat Semua <ArrowRight size={13} />
          </button>
        </div>

        <div className="px-5 py-2 relative z-10">
          {transactions.length === 0 && (
             <p className="text-center text-gray-500 text-sm py-8">Belum ada transaksi publik.</p>
          )}
          {transactions.map((trx) => (
            <div key={trx._id} className="flex items-center gap-3 py-3 px-1 border-b border-rose-50/50 last:border-0 hover:bg-white/40 transition-colors rounded-xl mx-[-4px] px-2">
               <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white ${trx.type === 'deposit' ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600' : trx.type === 'income' ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-500' : 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-500'}`}>
                  {trx.type === 'deposit' ? <ArrowDownToLine size={15} /> : trx.type === 'income' ? <PlusCircle size={15} /> : <ArrowUpFromLine size={15} />}
               </div>
               <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{trx.user.name} <span className="ml-1.5 text-[11px] font-bold uppercase">{trx.type}</span></p>
                  <p className="text-[11px] text-gray-500 mt-1">{new Date(trx.createdAt).toLocaleString('id-ID', {day:'numeric', month:'short'})} {trx.notes && `• ${trx.notes}`}</p>
               </div>
               <div className="text-right flex-shrink-0">
                  <p className={`font-extrabold text-sm ${trx.type === 'withdrawal' ? 'text-rose-500' : 'text-emerald-500'}`}>{trx.type === 'withdrawal' ? '−' : '+'} Rp {trx.amount.toLocaleString('id-ID')}</p>
                  {trx.proofOfTransfer && <button onClick={() => setImageModal(getImageUrl(trx.proofOfTransfer))} className="mt-1 flex items-center justify-end gap-1 w-full text-[10px] text-gray-400"><ImageIcon size={10} /> bukti</button>}
               </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {uploading && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center shadow-2xl">
               <Activity size={32} className="text-rose-500 animate-pulse mb-4" />
               <h3 className="font-bold relative z-10">Menyimpan...</h3>
             </motion.div>
           </div>
        )}
        {imageModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setImageModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-3xl w-full bg-white rounded-2xl overflow-hidden p-2" onClick={e => e.stopPropagation()}>
               <button onClick={() => setImageModal(null)} className="absolute top-4 right-4 bg-rose-500 text-white rounded-full p-1.5"><X size={18} /></button>
               <img src={imageModal} className="w-full max-h-[80vh] object-contain rounded-xl" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => !isResetting && setIsResetModalOpen(false)} title="PERINGATAN ❗">
         <div className="text-center p-2 space-y-4">
             <AlertTriangle size={60} className="mx-auto text-yellow-500 animate-pulse" />
             <p className="text-sm font-semibold text-gray-700">Apakah anda ingin menghapus semua data</p>
             <p className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-center">Aksi ini akan menghapus semua data yang ada di server</p>
             
             <div className="flex gap-3 mt-6">
                <Button onClick={() => setIsResetModalOpen(false)} variant="outline" className="flex-1 py-3 bg-gray-50 border-0">Batal</Button>
                <Button onClick={handleResetData} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200">
                   {isResetting ? <RefreshCcw className="animate-spin h-5 w-5 mx-auto" /> : 'Lanjutkan'}
                </Button>
             </div>
         </div>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal isOpen={!!categoryToDelete} onClose={() => setCategoryToDelete(null)} title="Hapus Kategori">
         <div className="text-center p-2 space-y-4">
             <AlertTriangle size={60} className="mx-auto text-rose-500 animate-pulse" />
             <p className="text-sm font-semibold text-gray-700">Apakah anda Yakin ingin menghapus Kategori Ini?</p>
             <p className="text-xs text-gray-500 bg-rose-50 p-3 rounded-xl border border-rose-100">Semua Riwayat yang ada di Kategori ini akan di hapus, dan balance sisa akan di kembalikan Ke Gaji</p>
             
             <div className="flex gap-3 mt-6">
                <Button onClick={() => setCategoryToDelete(null)} variant="outline" className="flex-1 py-3 bg-gray-50 border-0">Batal</Button>
                <Button onClick={confirmDeleteCategory} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200">
                   Lanjutkan
                </Button>
             </div>
         </div>
      </Modal>

      {/* Add New Category Custom (Envelope) Modal */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Buat Budget Baru ✉️">
         <form onSubmit={handleCategorySubmit} className="space-y-4 text-left">
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Nama Kategori</label>
             <input type="text" required value={categoryName} onChange={(e) => setCategoryName(e.target.value)} className="w-full px-4 py-3 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none bg-indigo-50/30 text-indigo-900 font-semibold" placeholder="Contoh: Belanja Bulanan" />
           </div>
           <div>
             <label className="block text-sm font-bold text-gray-700 mb-1">Pilih Ikon (Emoji)</label>
             <div className="flex gap-2 text-2xl flex-wrap">
               {['🏷️', '🛒', '☕', '🍔', '🛵', '💄', '💍', '🎮', '💊', '🎁'].map(em => (
                 <button type="button" key={em} onClick={() => setCategoryIcon(em)} className={`p-2 rounded-xl transition-all ${categoryIcon === em ? 'bg-indigo-100 scale-110 shadow-sm border border-indigo-200' : 'bg-gray-50 opacity-50 hover:opacity-100'}`}>
                   {em}
                 </button>
               ))}
             </div>
           </div>
           <Button type="submit" variant="primary" className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-lg rounded-xl shadow-[0_8px_20px_rgb(79,70,229,0.2)]" disabled={!categoryName}>
             Tambah Kategori {categoryIcon}
           </Button>
         </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !uploading && setIsModalOpen(false)} title={
        type === 'deposit' ? 'Top-Up Saldo 💖' : type === 'income' ? 'Catat Pemasukan 🎉' : type === 'allocation' ? 'Sedot dari Gaji 💧' : 'Catat Pemakaian 💸'
      }>
        <form onSubmit={handleTransactionSubmit} className="space-y-4 text-left">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
               {type === 'allocation' ? 'Tujuan Aliran Dana' : 'Pilih Sumber Dana / Tujuan'}
            </label>
            <div className="relative">
              <div onClick={() => setIsSelectOpen(!isSelectOpen)} className={`w-full px-4 py-3 border rounded-xl flex justify-between items-center cursor-pointer ${type === 'allocation' ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-200'}`}>
                <span className="truncate font-medium text-gray-800">
                  {type === 'allocation' ? (
                     categories.find(c => c._id === toCategory)?.name || 'Pilih Amplop...'
                  ) : fundSource === 'tabungan_utama' && budgetId ? budgets.find(b => b._id === budgetId)?.title 
                   : fundSource === 'tabungan_utama' ? '🌟 Tabungan Bersama (Utama Publik)'
                   : fundSource === 'gaji' ? '💼 Saldo Gaji (Pribadi)'
                   : categories.find(c => c._id === fundSource)?.name || '...'}
                </span>
                <ChevronDown size={18} className="text-gray-400" />
              </div>
              
              {isSelectOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {type === 'allocation' ? (
                     <div className="py-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-1">Pilih Amplop Penerima</div>
                        {categories.map(c => (
                           <div key={c._id} onClick={() => { setToCategory(c._id); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 text-indigo-700 font-semibold">{c.icon} {c.name}</div>
                        ))}
                     </div>
                  ) : (
                     <>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-2 bg-gray-50">Publik (Dilihat Bersama)</div>
                        <div onClick={() => { setFundSource('tabungan_utama'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 text-emerald-600 font-bold transition-colors">🌟 Tabungan Bersama (Utama)</div>
                        {budgets.map(b => (
                           <div key={b._id} onClick={() => { setFundSource('tabungan_utama'); setBudgetId(b._id); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-50 text-gray-700 pl-8 font-medium truncate">{b.title}</div>
                        ))}

                        <div className="text-xs font-bold text-gray-400 py-2 uppercase tracking-wider px-4 bg-gray-50">Private (Dompet Anda)</div>
                        <div onClick={() => { setFundSource('gaji'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-emerald-100 text-emerald-700 font-bold bg-emerald-50/30">💼 Dompet Gaji Utama</div>
                        {categories.map(c => (
                           <div key={c._id} onClick={() => { setFundSource(c._id); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 text-indigo-700 font-semibold truncate pl-8">{c.icon} {c.name}</div>
                        ))}
                     </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
            <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 text-xl font-extrabold text-indigo-900 shadow-inner" placeholder="100000"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Singkat</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 outline-none bg-gray-50" placeholder={type === 'allocation' ? 'Sisihkan gaji buat...' : 'Keterangan'} />
          </div>

          {type !== 'allocation' && (
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Gambar (Opsional)</label>
               <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-600"/>
             </div>
          )}

          <Button type="submit" variant={type === 'withdrawal' ? 'outline' : 'primary'} className={`w-full mt-6 py-3 text-lg rounded-xl shadow-md ${type === 'allocation' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`} disabled={type === 'allocation' && !toCategory}>
            {uploading ? 'Menyimpan...' : type === 'allocation' ? 'Transfer Saldo' : 'Konfirmasi Transaksi'}
          </Button>
        </form>
      </Modal>

    </motion.div>
  );
};

export default Dashboard;
