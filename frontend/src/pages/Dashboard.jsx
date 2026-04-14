import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowDownToLine, ArrowUpFromLine, PlusCircle, Activity, ChevronDown, X, ArrowRight, Settings, Wallet, ShoppingBag, Coffee } from 'lucide-react';

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5050';
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getApiUrl()}${path}`;
};

// Circle Progress Component for Auto Budget
const CircularProgress = ({ value, max, colorClass, size = 60, strokeWidth = 6, icon: Icon }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeMax = max <= 0 ? 1 : max;
  const safeValue = value < 0 ? 0 : value > safeMax ? safeMax : value;
  const strokeDashoffset = circumference - (safeValue / safeMax) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg className="transform -rotate-90 absolute inset-0" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-100"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-1000 ease-out ${colorClass}`}
          strokeLinecap="round"
        />
      </svg>
      {Icon && <Icon size={size * 0.4} className={colorClass} />}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalTabungan, setTotalTabungan] = useState(0);
  const [uangKeluar, setUangKeluar] = useState(0);
  const [imageModal, setImageModal] = useState(null);
  
  // Auto Budgeting State
  const [monthlyBudget, setMonthlyBudget] = useState({ income: 0, keperluan: 0, belanja: 0 });
  const [budgetTransactions, setBudgetTransactions] = useState([]);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ income: '', keperluan: '', belanja: '' });
  const [savingBudget, setSavingBudget] = useState(false);

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [fundSource, setFundSource] = useState('tabungan_utama');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const { showToast } = useToast();

  const prevDataRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const monthStr = new Date().toISOString().substring(0, 7);
      const [budgetsRes, transactionsRes, monthlyRes, budgetTxRes] = await Promise.all([
        api.get('/api/budget'),
        api.get('/api/transactions'),
        api.get(`/api/budgeting/${monthStr}`),
        api.get(`/api/transactions/budget/${monthStr}`),
      ]);
      const allTx = transactionsRes.data;

      const newSignature = JSON.stringify({
        txIds: allTx.map(t => t._id + t.amount).join(','),
        budgetAmounts: budgetsRes.data.map(b => b._id + b.currentAmount).join(','),
        monthly: monthlyRes.data.updatedAt,
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
      
      setMonthlyBudget(monthlyRes.data);
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

  const openTransactionModal = (txType) => {
    setType(txType);
    setFundSource('tabungan_utama');
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
        budgetId: (fundSource === 'tabungan_utama' && budgetId) ? budgetId : undefined,
        fundSource,
        notes,
        proofOfTransfer
      });

      const msg = type === 'deposit' ? 'Berhasil nabung.' : type === 'income' ? 'Pemasukan dicatat!' : 'Pinjaman dicatat.';
      showToast(msg, 'success');
      setIsModalOpen(false);
      setAmount('');
      setNotes('');
      setBudgetId('');
      setFundSource('tabungan_utama');
      setFile(null);
      setIsSelectOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan transaksi', 'error');
    } finally {
      setUploading(false);
    }
  };

  const openBudgetModal = () => {
    setBudgetForm({
      income: monthlyBudget.income || '',
      keperluan: monthlyBudget.keperluan || '',
      belanja: monthlyBudget.belanja || ''
    });
    setIsBudgetModalOpen(true);
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    setSavingBudget(true);
    try {
      const monthStr = new Date().toISOString().substring(0, 7);
      await api.post(`/api/budgeting/${monthStr}`, budgetForm);
      showToast('Budget bulanan berhasil disimpan', 'success');
      setIsBudgetModalOpen(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan budget', 'error');
    } finally {
      setSavingBudget(false);
    }
  };

  // Helper to calculate remaining budget
  const getSisa = (category, baseAmount) => {
    const txs = budgetTransactions.filter(t => t.fundSource === category);
    const spent = txs.filter(t => t.type === 'withdrawal').reduce((a,c) => a + c.amount, 0);
    const added = txs.filter(t => t.type === 'income' || t.type === 'deposit').reduce((a,c) => a + c.amount, 0);
    return { sisa: baseAmount + added - spent, spent };
  };

  const gajiStats = getSisa('gaji', monthlyBudget.income);
  const keperluanStats = getSisa('keperluan', monthlyBudget.keperluan);
  const belanjaStats = getSisa('belanja', monthlyBudget.belanja);

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

        {/* Quick Actions */}
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
            </button>

            <button 
                onClick={() => openTransactionModal('withdrawal')}
                className="flex-1 glass bg-white/60 hover:bg-white/90 transition-all rounded-3xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-sm border border-rose-100 group"
            >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-1.5 md:mb-2 group-hover:scale-110 transition-transform">
                    <ArrowUpFromLine size={20} />
                </div>
                <h3 className="font-bold text-gray-800 text-sm md:text-base">Pinjam/Pakai</h3>
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
          </button>
        </div>
      </div>

      {/* AUTO BUDGETING DASHBOARD */}
      <div className="bg-white rounded-3xl shadow-md border border-purple-100 overflow-hidden relative">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 px-5 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <PieChartIcon className="text-purple-500" size={20} /> Auto Budgeting Bulanan
          </h3>
          <button
            onClick={openBudgetModal}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white border border-purple-200 px-3 py-1.5 rounded-full text-purple-600 hover:bg-purple-50 transition-colors shadow-sm"
          >
            <Settings size={14} /> Atur Budget
          </button>
        </div>
        
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Gaji/Income */}
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-2 left-2 bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Private</div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mt-4">Sisa Gaji</p>
            <div className="my-3">
              <CircularProgress 
                value={gajiStats.sisa} 
                max={monthlyBudget.income} 
                colorClass="text-emerald-500" 
                icon={Wallet} 
                size={70} 
              />
            </div>
            <h4 className="font-bold text-lg text-gray-800">Rp {gajiStats.sisa.toLocaleString('id-ID')}</h4>
            <p className="text-[11px] text-gray-400 mt-1">Terpakai: Rp {gajiStats.spent.toLocaleString('id-ID')}</p>
          </div>

          {/* Keperluan */}
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-2 left-2 bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Private</div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mt-4">Keperluan</p>
            <div className="my-3">
              <CircularProgress 
                value={keperluanStats.sisa} 
                max={monthlyBudget.keperluan} 
                colorClass="text-blue-500" 
                icon={Coffee} 
                size={70} 
              />
            </div>
            <h4 className="font-bold text-lg text-gray-800">Rp {keperluanStats.sisa.toLocaleString('id-ID')}</h4>
            <p className="text-[11px] text-gray-400 mt-1">Terpakai: Rp {keperluanStats.spent.toLocaleString('id-ID')}</p>
          </div>

          {/* Belanja */}
          <div className="flex flex-col items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-2 left-2 bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Private</div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mt-4">Sisa Belanja</p>
            <div className="my-3">
              <CircularProgress 
                value={belanjaStats.sisa} 
                max={monthlyBudget.belanja} 
                colorClass="text-rose-500" 
                icon={ShoppingBag} 
                size={70} 
              />
            </div>
            <h4 className="font-bold text-lg text-gray-800">Rp {belanjaStats.sisa.toLocaleString('id-ID')}</h4>
            <p className="text-[11px] text-gray-400 mt-1">Terpakai: Rp {belanjaStats.spent.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-md border border-pink-50 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-pink-100 px-5 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-rose-400" size={20} /> Transaksi Publik Terakhir
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
              <p className="text-gray-500 text-sm">Belum ada transaksi di tabungan utama.</p>
            </div>
          )}
          {transactions.map((trx) => (
            <div key={trx._id} className="flex items-center gap-3 py-3 px-1 border-b border-gray-50 last:border-0">
               <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                trx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600'
                : trx.type === 'income' ? 'bg-blue-100 text-blue-500'
                : 'bg-rose-100 text-rose-500'
              }`}>
                {trx.type === 'deposit' ? <ArrowDownToLine size={15} /> : trx.type === 'income' ? <PlusCircle size={15} /> : <ArrowUpFromLine size={15} />}
              </div>

               <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">
                  {trx.user.name}
                  <span className={`ml-1.5 text-xs font-normal ${
                    trx.type === 'deposit' ? 'text-emerald-500' : trx.type === 'income' ? 'text-blue-500' : 'text-rose-400'
                  }`}>
                    {trx.type === 'deposit' ? 'menabung' : trx.type === 'income' ? 'pemasukan' : 'meminjam'}
                  </span>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                  {new Date(trx.createdAt).toLocaleString('id-ID', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}
                  {trx.notes ? ` · ${trx.notes}` : ''}
                </p>
              </div>

               <div className="text-right flex-shrink-0">
                <p className={`font-bold text-sm tabular-nums ${
                  trx.type === 'deposit' ? 'text-emerald-600' : trx.type === 'income' ? 'text-blue-600' : 'text-rose-500'
                }`}>
                  {trx.type === 'withdrawal' ? '−' : '+'} Rp {trx.amount.toLocaleString('id-ID')}
                </p>
                {trx.proofOfTransfer && (
                  <button onClick={() => setImageModal(getImageUrl(trx.proofOfTransfer))} className="mt-0.5 text-[10px] font-medium text-blue-400 hover:text-blue-600 underline underline-offset-2 transition-colors">lihat bukti</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {/* Loading Overlay */}
        {uploading && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} className="bg-white p-6 md:p-8 rounded-3xl flex flex-col items-center justify-center shadow-2xl relative overflow-hidden max-w-xs w-full">
               <div className="absolute inset-0 bg-gradient-to-r from-rose-50/50 to-pink-50/50 z-0"></div>
               <div className="relative z-10">
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }} className="bg-rose-100 p-4 rounded-full text-rose-500 mb-4 shadow-sm">
                   <Activity size={32} />
                 </motion.div>
               </div>
               <h3 className="font-bold text-gray-800 text-lg relative z-10">{file ? 'Mengunggah...' : 'Menyimpan...'}</h3>
               <p className="text-xs text-gray-500 mt-2 text-center relative z-10">Tunggu sebentar ya 💖</p>
               <div className="w-full bg-pink-100 h-1.5 mt-5 rounded-full overflow-hidden relative z-10">
                 <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2, repeat: Infinity }} className="bg-rose-500 h-full rounded-full"></motion.div>
               </div>
             </motion.div>
           </div>
        )}
        
        {/* Image Modal */}
        {imageModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setImageModal(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setImageModal(null)} className="absolute top-3 right-3 bg-rose-500 text-white rounded-full p-1.5 shadow-md hover:bg-rose-600 z-10"><X size={18} /></button>
              <img src={imageModal} className="max-w-full max-h-[80vh] object-contain w-full" onError={(e) => { e.currentTarget.classList.add('hidden'); e.currentTarget.nextSibling.classList.remove('hidden'); }} />
              <div className="hidden p-8 text-center text-gray-500"><p className="text-lg">❌ Gambar tidak dapat dimuat</p></div>
              <div className="p-3 bg-gray-50 text-center border-t"><a href={imageModal} target="_blank" rel="noreferrer" className="text-rose-500 text-sm font-semibold hover:underline">Buka di Tab Baru</a></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Budget Configuration Modal */}
      <Modal isOpen={isBudgetModalOpen} onClose={() => !savingBudget && setIsBudgetModalOpen(false)} title="Atur Budget Bulanan 💼">
        <form onSubmit={handleBudgetSubmit} className="space-y-4 text-left">
          <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 mb-4">
            <p className="text-xs text-purple-700 font-medium leading-relaxed">
              Ini adalah catatan pribadi Anda. <br/>Data Gaji, Keperluan, & Belanja tidak akan campur ke riwayat publik pasangan/Tabungan Utama.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Gaji Bulanan (Rp)</label>
            <input type="number" required value={budgetForm.income} onChange={(e) => setBudgetForm({...budgetForm, income: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-gray-50 focus:bg-white font-semibold" placeholder="Berapa target saldo gaji?"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Keperluan (Rp)</label>
            <input type="number" required value={budgetForm.keperluan} onChange={(e) => setBudgetForm({...budgetForm, keperluan: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-gray-50 focus:bg-white font-semibold" placeholder="Berapa budget keperluan?"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Belanja/Jajan (Rp)</label>
            <input type="number" required value={budgetForm.belanja} onChange={(e) => setBudgetForm({...budgetForm, belanja: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none bg-gray-50 focus:bg-white font-semibold" placeholder="Berapa sisa buat belanja?"/>
          </div>
          <Button type="submit" variant="primary" className="w-full mt-6 py-3 text-lg rounded-xl bg-purple-600 hover:bg-purple-700">
            {savingBudget ? 'Menyimpan...' : 'Simpan Budget'}
          </Button>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !uploading && setIsModalOpen(false)} title={
        type === 'deposit' ? 'Catat Nabung 💖' : type === 'income' ? 'Catat Pemasukan 🎉' : 'Catat Pemakaian 💸'
      }>
        <form onSubmit={handleTransactionSubmit} className="space-y-4 text-left">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Sumber Dana / Tujuan</label>
            <div className="relative">
              <div onClick={() => setIsSelectOpen(!isSelectOpen)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 flex justify-between items-center cursor-pointer">
                <span className={`truncate font-medium ${fundSource === 'tabungan_utama' ? 'text-emerald-600' : 'text-purple-600'}`}>
                  {fundSource === 'tabungan_utama' && budgetId ? budgets.find(b => b._id === budgetId)?.title 
                   : fundSource === 'tabungan_utama' ? '🌟 Tabungan Bersama (Utama)'
                   : fundSource === 'gaji' ? '💼 Saldo Gaji (Pribadi)'
                   : fundSource === 'keperluan' ? '☕ Saldo Keperluan (Pribadi)'
                   : '🛍️ Saldo Belanja (Pribadi)'}
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isSelectOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-2 bg-gray-50">Publik (Dilihat Bersama)</div>
                  <div onClick={() => { setFundSource('tabungan_utama'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-50 text-emerald-600 font-bold transition-colors">
                    🌟 Tabungan Bersama (Utama)
                  </div>
                  {budgets.map(b => (
                    <div key={b._id} onClick={() => { setFundSource('tabungan_utama'); setBudgetId(b._id); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-50 text-gray-700 pl-8">
                      <p className="font-medium">{b.title}</p>
                    </div>
                  ))}

                  <div className="text-xs font-bold text-gray-400 py-2 uppercase tracking-wider px-4 bg-gray-50">Private (Hanya Anda)</div>
                  <div onClick={() => { setFundSource('gaji'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 text-purple-700 font-semibold">
                    💼 Potong dari Gaji
                  </div>
                  <div onClick={() => { setFundSource('keperluan'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 text-blue-700 font-semibold">
                    ☕ Potong dari Keperluan
                  </div>
                  <div onClick={() => { setFundSource('belanja'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-50 text-rose-600 font-semibold">
                    🛍️ Potong dari Belanja
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
            <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none bg-gray-50 text-lg font-semibold" placeholder="100000"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan Singkat</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none bg-gray-50" placeholder="Keterangan..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bukti Gambar (Opsional)</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-600"/>
          </div>

          <Button type="submit" variant={type === 'withdrawal' ? 'outline' : 'primary'} className="w-full mt-6 py-3 text-lg rounded-xl">
            {uploading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </Button>
        </form>
      </Modal>

    </motion.div>
  );
};

// Simple standalone SVG Icon trick
const PieChartIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
  </svg>
);

export default Dashboard;
