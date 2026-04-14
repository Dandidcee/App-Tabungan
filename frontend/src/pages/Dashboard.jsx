import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowDownToLine, ArrowUpFromLine, PlusCircle, Activity, ChevronDown, Image as ImageIcon, X, ArrowRight } from 'lucide-react';

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
  
  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const { showToast } = useToast();

  const prevDataRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [budgetsRes, transactionsRes] = await Promise.all([
        api.get('/api/budget'),
        api.get('/api/transactions'),
      ]);
      const allTx = transactionsRes.data;

      // ── Anti-flicker: only update state if data actually changed ──
      const newSignature = JSON.stringify({
        txIds: allTx.map(t => t._id + t.amount).join(','),
        budgetAmounts: budgetsRes.data.map(b => b._id + b.currentAmount).join(',')
      });

      if (prevDataRef.current === newSignature) return; // Nothing changed
      prevDataRef.current = newSignature;

      // income & deposit both ADD to total, withdrawal subtracts
      const deposits = allTx.filter(t => (t.type === 'deposit' || t.type === 'income') && !t.budgetId).reduce((a, c) => a + c.amount, 0);
      const withdrawals = allTx.filter(t => t.type === 'withdrawal' && !t.budgetId).reduce((a, c) => a + c.amount, 0);
      setTotalTabungan(deposits - withdrawals);
      setUangKeluar(withdrawals);
      setBudgets(budgetsRes.data);
      setTransactions(allTx.reverse().slice(0, 5));
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const openTransactionModal = (txType) => {
    setType(txType);
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

      const msg = type === 'deposit' ? 'Asyik! Berhasil nabung.' : type === 'income' ? 'Pemasukan tambahan dicatat!' : 'Uang pinjaman dicatat.';
      showToast(msg, 'success');
      setIsModalOpen(false);
      setAmount('');
      setNotes('');
      setBudgetId('');
      setFile(null);
      setIsSelectOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan transaksi', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24 md:pb-6"
    >
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Halo, {user?.name} 💖</h1>
        <p className="italic text-sm sm:text-base text-gray-500 mt-1">semangat nabungnya ya</p>
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
                <p className="text-xs text-pink-100 font-medium">Uang Pinjaman / Keluar</p>
                <p className="text-lg font-bold">Rp {uangKeluar.toLocaleString('id-ID')}</p>
              </div>
              <p className="text-sm text-pink-100 italic">"Satu langkah lebih dekat."</p>
            </div>
          </div>
          <Heart size={200} className="absolute -right-10 -bottom-10 text-white/10" />
        </Card>

        {/* Quick Actions — 3 buttons */}
        <div className="col-span-1 flex flex-col gap-3">
          <div className="flex flex-row md:flex-col gap-3 flex-1">
            <button 
                onClick={() => openTransactionModal('deposit')}
                className="flex-1 glass bg-white/60 hover:bg-white/90 transition-all rounded-3xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-sm border border-emerald-100 group"
            >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-1.5 md:mb-2 group-hover:scale-110 transition-transform">
                    <ArrowDownToLine size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm md:text-base">Nabung</h3>
                <p className="text-[10px] text-gray-500 hidden md:block">Tambah saldo</p>
            </button>

            <button 
                onClick={() => openTransactionModal('withdrawal')}
                className="flex-1 glass bg-white/60 hover:bg-white/90 transition-all rounded-3xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-sm border border-rose-100 group"
            >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-1.5 md:mb-2 group-hover:scale-110 transition-transform">
                    <ArrowUpFromLine size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm md:text-base">Pinjam</h3>
                <p className="text-[10px] text-gray-500 hidden md:block">Ambil/pinjam uang</p>
            </button>
          </div>

          <button 
              onClick={() => openTransactionModal('income')}
              className="glass bg-white/60 hover:bg-white/90 transition-all rounded-3xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-sm border border-blue-100 group"
          >
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-1.5 md:mb-2 group-hover:scale-110 transition-transform">
                  <PlusCircle size={20} />
              </div>
              <h3 className="font-bold text-gray-800 text-sm md:text-base">Pemasukan</h3>
              <p className="text-[10px] text-gray-500 hidden md:block">Pendapatan lain</p>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md border border-pink-50 overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-pink-100 px-5 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-rose-400" size={20} /> Transaksi Terakhir
          </h3>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
          >
            Lihat Semua <ArrowRight size={13} />
          </button>
        </div>

        <div className="px-5 py-2">
          {transactions.length === 0 && (
            <div className="text-center py-8">
              <Heart size={32} className="mx-auto text-rose-200 mb-2" />
              <p className="text-gray-500 text-sm">Belum ada transaksi,<br/>mulailah menabung!</p>
            </div>
          )}
          {transactions.map((trx) => (
            <div
              key={trx._id}
              className="flex items-center gap-3 py-3 px-1 border-b border-gray-50 last:border-0"
            >
              {/* Colored dot + icon */}
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                trx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600'
                : trx.type === 'income' ? 'bg-blue-100 text-blue-500'
                : 'bg-rose-100 text-rose-500'
              }`}>
                {trx.type === 'deposit' ? <ArrowDownToLine size={15} />
                : trx.type === 'income' ? <PlusCircle size={15} />
                : <ArrowUpFromLine size={15} />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {trx.user.name}
                  <span className={`ml-1.5 text-xs font-normal ${
                    trx.type === 'deposit' ? 'text-emerald-500'
                    : trx.type === 'income' ? 'text-blue-500'
                    : 'text-rose-400'
                  }`}>
                    {trx.type === 'deposit' ? 'menabung' : trx.type === 'income' ? 'pemasukan' : 'meminjam'}
                  </span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {new Date(trx.createdAt).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                  {trx.notes ? ` · ${trx.notes}` : ''}
                </p>
              </div>

              {/* Amount + Bukti */}
              <div className="text-right flex-shrink-0">
                <p className={`font-bold text-sm tabular-nums ${
                  trx.type === 'deposit' ? 'text-emerald-600'
                  : trx.type === 'income' ? 'text-blue-600'
                  : 'text-rose-500'
                }`}>
                  {trx.type === 'withdrawal' ? '−' : '+'} Rp {trx.amount.toLocaleString('id-ID')}
                </p>
                {trx.proofOfTransfer && (
                  <button
                    onClick={() => setImageModal(getImageUrl(trx.proofOfTransfer))}
                    className="mt-0.5 text-[10px] font-medium text-blue-400 hover:text-blue-600 underline underline-offset-2 transition-colors"
                  >
                    lihat bukti
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading Overlay Overlay & Image Viewer Modal */}
      <AnimatePresence>
        {uploading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center shadow-2xl relative overflow-hidden max-w-xs w-full"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-rose-50/50 to-pink-50/50 z-0"></div>
              
              <div className="relative z-10">
                {/* Heart Beating Animation */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="bg-rose-100 p-4 rounded-full text-rose-500 mb-4 shadow-sm"
                >
                  <Activity size={32} />
                </motion.div>
              </div>

              <h3 className="font-bold text-gray-800 text-lg relative z-10">{file ? 'Mengunggah Gambar...' : 'Menyimpan...'}</h3>
              <p className="text-xs text-gray-500 mt-2 text-center relative z-10">
                Tunggu sebentar ya, transaksi kamu sedang dicatat dengan penuh cinta 💖
              </p>

              {/* Progress bar placeholder */}
              <div className="w-full bg-pink-100 h-1.5 mt-5 rounded-full overflow-hidden relative z-10">
                <motion.div 
                  initial={{ width: "0%" }} 
                  animate={{ width: "100%" }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-rose-500 h-full rounded-full"
                ></motion.div>
              </div>
            </motion.div>
          </div>
        )}

        {imageModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setImageModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setImageModal(null)}
                className="absolute top-3 right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 z-10"
              >
                <X size={18} />
              </button>
              <img
                src={imageModal}
                alt="Bukti Transfer"
                className="max-w-full max-h-[80vh] object-contain w-full"
                onError={(e) => {
                  e.currentTarget.classList.add('hidden');
                  e.currentTarget.nextSibling.classList.remove('hidden');
                }}
              />
              <div className="hidden p-8 text-center text-gray-500">
                <p className="text-lg">❌ Gambar tidak dapat dimuat</p>
                <p className="text-sm mt-1 text-gray-400">File mungkin dihapus dari server</p>
              </div>
              <div className="p-3 bg-gray-50 text-center border-t">
                <a href={imageModal} target="_blank" rel="noreferrer" className="text-rose-500 text-sm font-semibold hover:underline">
                  Buka di Tab Baru
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Modal directly from Dashboard */}
      <Modal isOpen={isModalOpen} onClose={() => !uploading && setIsModalOpen(false)} title={
        type === 'deposit' ? 'Catat Nabung 💖'
        : type === 'income' ? 'Catat Pemasukan 🎉'
        : 'Catat Pinjaman Uang 💸'
      }>
        <form onSubmit={handleTransactionSubmit} className="space-y-4 text-left">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none transition-all bg-gray-50 focus:bg-white text-lg font-semibold"
              placeholder="100000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alokasikan ke Target Nikah (Jika Ada)</label>
            <div className="relative">
              <div 
                onClick={() => setIsSelectOpen(!isSelectOpen)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 flex justify-between items-center cursor-pointer transition-colors"
              >
                <span className="truncate font-medium text-gray-700">
                  {budgetId ? budgets.find(b => b._id === budgetId)?.title : '-- Masukkan ke Tabungan Bersama (Utama) --'}
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isSelectOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-pink-100 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] max-h-60 overflow-y-auto">
                  <div 
                    onClick={() => { setBudgetId(''); setIsSelectOpen(false); }}
                    className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-50 text-emerald-600 font-bold transition-colors"
                  >
                    🌟 Tabungan Bersama (Utama)
                  </div>
                  {budgets.map(b => (
                    <div 
                      key={b._id} 
                      onClick={() => { setBudgetId(b._id); setIsSelectOpen(false); }}
                      className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-50 text-gray-700 transition-colors"
                    >
                      <p className="font-medium">{b.title}</p>
                      <p className="text-xs text-rose-400 mt-0.5">Sisa: Rp {(b.targetAmount - b.currentAmount).toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Keterangan</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder={
                type === 'deposit' ? 'Menabung uang sisa belanja...'
                : type === 'income' ? 'Bonus gaji, uang lebaran...'
                : 'Pinjam untuk benerin motor'
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Gambar Transaksi (Opsional)</label>
            <div className="relative">
                <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none transition-all bg-gray-50 focus:bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100"
                />
            </div>
          </div>

          <Button type="submit" variant={type === 'withdrawal' ? 'outline' : 'primary'} className="w-full mt-6 py-3 text-lg rounded-xl">
            {uploading ? 'Menyimpan...' : (
              type === 'deposit' ? 'Simpan Tabungan'
              : type === 'income' ? 'Catat Pemasukan'
              : 'Catat Uang Dipinjam'
            )}
          </Button>
        </form>
      </Modal>

    </motion.div>
  );
};

export default Dashboard;
