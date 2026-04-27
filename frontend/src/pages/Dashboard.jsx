import { useEffect, useState, useContext, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import CurrencyInput from '../components/ui/CurrencyInput';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowDownToLine, ArrowUpFromLine, PlusCircle, Activity, ChevronDown, Image as ImageIcon, X, ArrowRight, Settings, Wallet, ShoppingBag, Coffee, Plus, AlertTriangle, RefreshCcw, Calculator, Pencil, CreditCard, ChevronRight, Trash2 } from 'lucide-react';
import { setIndonesianValidity } from '../utils/validation';
import CalculatorModal from '../components/ui/CalculatorModal';


const WEALTH_QUOTES = [
  "Sedikit demi sedikit, lama-lama menjadi bukit.",
  "Investasi terbaik adalah pada diri sendiri.",
  "Hemat pangkal kaya.",
  "Kekayaan bukan seberapa banyak yang dihasilkan, tapi yang disimpan.",
  "Waktu lebih berharga daripada uang.",
  "Kekayaan sejati adalah merasa cukup.",
  "Kebebasan finansial dimulai dari langkah kecil hari ini.",
  "Bukan seberapa besar pendapatan, tapi pintarnya kelola pengeluaran.",
  "Jangan menabung sisanya, belanjalah dari sisa tabunganmu.",
  "Uang adalah hamba yang baik, namun tuan yang buruk."
];

const CATEGORY_EMOJIS = ['💼', '💰', '🏷️', '🛒', '☕', '🍔', '🛵', '💄', '🧴', '💅', '🪞', '🧽', '🎀', '✨', '💍', '🎮', '💊', '🎁', '✈️', '🐶', '👶'];


const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // --- Batch all server data into one state to prevent multiple re-renders (flicker) ---
  const [serverData, setServerData] = useState({
    budgets: [],
    transactions: [],
    totalTabungan: 0,
    uangKeluar: 0,
    categories: [],
    budgetTransactions: [],
  });
  const { budgets, transactions, totalTabungan, uangKeluar, categories, budgetTransactions } = serverData;

  const [imageModal, setImageModal] = useState(null);

  // Auto Budgeting State (Envelope — UI-only, not from server batch)
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

  // Category Deletion State
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  // Category Edit State
  const [categoryToEdit, setCategoryToEdit] = useState(null); // { _id, name, icon } atau 'gaji'
  
  // Active Category (for bottom sheet actions)
  const [activeCategory, setActiveCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [originalBalance, setOriginalBalance] = useState(0);

  // Local state untuk Dompet Gaji (karena bukan dari DB)
  const [gajiName, setGajiName] = useState(() => localStorage.getItem('gajiName') || 'Dompet Gaji');
  const [gajiIcon, setGajiIcon] = useState(() => localStorage.getItem('gajiIcon') || '💼');
  // Recent transactions tab
  const [recentTab, setRecentTab] = useState('public');
  // Source mode for deposit/income: 'external' (manual input) | 'internal' (deduct from balance)
  const [sourceMode, setSourceMode] = useState('external');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [randomQuote, setRandomQuote] = useState(WEALTH_QUOTES[0]);

  const { showToast } = useToast();
  const prevDataRef = useRef(null);

  useEffect(() => {
    setRandomQuote(WEALTH_QUOTES[Math.floor(Math.random() * WEALTH_QUOTES.length)]);
  }, []);

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

      const deposits = allTx.filter(t => !t.isTransfer && (t.type === 'deposit' || t.type === 'income') && !t.budgetId).reduce((a, c) => a + c.amount, 0);
      const withdrawals = allTx.filter(t => !t.isTransfer && t.type === 'withdrawal' && !t.budgetId).reduce((a, c) => a + c.amount, 0);

      // Single setState call = single render, no flicker
      setServerData({
        totalTabungan: deposits - withdrawals,
        uangKeluar: withdrawals,
        budgets: budgetsRes.data,
        transactions: allTx.reverse().slice(0, 5),
        categories: catsRes.data,
        budgetTransactions: budgetTxRes.data,
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // 30s — kurangi load CPU
    return () => clearInterval(interval);
  }, [fetchData]);

  const openTransactionModal = (txType, overrideSource = 'tabungan_utama', overrideToCat = '') => {
    setType(txType);
    setFundSource(overrideSource);
    setToCategory(overrideToCat);
    setAmount('');
    setSourceMode('external'); // default to external
    setIsModalOpen(true);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();

    // Validasi saldo sebelum lanjut
    if (type === 'allocation' || type === 'withdrawal') {
      const spendAmount = Number(amount);
      if (!spendAmount || spendAmount <= 0) {
        return showToast('Masukkan nominal yang valid!', 'error');
      }

      if (fundSource === 'gaji') {
        if (spendAmount > gajiBalance) {
          return showToast('Saldo Gaji tidak cukup!', 'error');
        }
      } else if (fundSource !== 'tabungan_utama') {
        const catBalance = getEnvelopeBalance(fundSource);
        if (spendAmount > catBalance) {
          return showToast('Saldo Kategori tidak cukup!', 'error');
        }
      }
    }

    setUploading(true);
    try {
      let proofOfTransfer = '';
      if (file) {
        const formData = new FormData();
        formData.append('proof', file);
        const uploadRes = await api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        proofOfTransfer = uploadRes.data.filePath;
      }

      // For deposit/income in external mode:
      // - fundSource remains as selected destination (tabungan_utama or gaji or category)
      // - type stays 'income' to just add to balance without deducting from anywhere else
      const finalFundSource = (type === 'deposit' || type === 'income')
        ? (sourceMode === 'external'
          ? (toCategory || fundSource)  // destination chosen by user
          : fundSource)                 // internal: deduct from fundSource
        : fundSource;

      const finalType = (type === 'deposit' || type === 'income')
        ? (sourceMode === 'internal'
          ? 'allocation' // treat as allocation: deduct from source, add to destination
          : type)        // external: just add (deposit or income)
        : type;

      // Helper: resolve readable name from fundSource/category/budget ID
      const getNameById = (id) => {
        if (id === 'tabungan_utama') return 'Tabungan Bersama';
        if (id === 'gaji') return 'Dompet Gaji';
        const cat = categories.find(c => c._id === id);
        if (cat) return `${cat.icon} ${cat.name}`;
        const bgt = budgets.find(b => b._id === id);
        if (bgt) return `🎯 ${bgt.title}`;
        return id;
      };

      // Auto-generate smart notes if user didn't write custom notes
      let finalNotes = notes;
      if (!notes && (type === 'deposit' || type === 'income')) {
        if (sourceMode === 'external') {
          const destName = budgetId
            ? getNameById(budgetId)
            : getNameById(toCategory || fundSource);
          finalNotes = `Income ke ${destName}`;
        } else if (sourceMode === 'internal') {
          const srcName = getNameById(fundSource);
          const destName = budgetId
            ? getNameById(budgetId)
            : getNameById(toCategory);
          finalNotes = `${srcName} transfer ke ${destName}`;
        }
      }

      // For external mode, send the destination as fundSource  
      // For internal mode, it's handled as allocation (fundSource → toCategory)
      await api.post('/api/transactions', {
        amount: Number(amount),
        type: finalType,
        budgetId: (finalFundSource === 'tabungan_utama' && budgetId) ? budgetId : undefined,
        fundSource: finalFundSource,
        toCategory: (type === 'allocation' || sourceMode === 'internal') ? toCategory : undefined,
        notes: finalNotes,
        proofOfTransfer
      });

      const msg = type === 'deposit' ? 'Berhasil nabung.' : type === 'income' ? 'Pemasukan dicatat!' : type === 'allocation' ? 'Alokasi berhasil ditambahkan.' : 'Pinjaman dicatat.';
      showToast(msg, 'success');
      setIsModalOpen(false);
      setAmount(''); setNotes(''); setBudgetId(''); setFundSource('tabungan_utama'); setToCategory(''); setFile(null); setIsSelectOpen(false); setSourceMode('external');
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

  const openEditModal = (cat) => {
    setCategoryToEdit(cat);
    setEditName(cat.name);
    setEditIcon(cat.icon);
    
    // Hitung saldo saat ini
    const envTxs = budgetTransactions.filter(t => t.fundSource === cat._id);
    const currentBal = envTxs.reduce((acc, t) => {
      if (t.type === 'deposit' || t.type === 'income') return acc + t.amount;
      if (t.type === 'withdrawal' || t.type === 'allocation') return acc - t.amount;
      return acc;
    }, 0);
    
    setOriginalBalance(currentBal);
    setEditBalance(currentBal.toString());
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!categoryToEdit) return;

    try {
      if (categoryToEdit._id === 'gaji') {
        localStorage.setItem('gajiName', editName);
        localStorage.setItem('gajiIcon', editIcon);
        setGajiName(editName);
        setGajiIcon(editIcon);
        showToast(`Dompet Gaji berhasil diperbarui!`, 'success');
      } else {
        await api.put(`/api/budgeting/categories/${categoryToEdit._id}`, {
          name: editName,
          icon: editIcon,
        });
        showToast(`Amplop ${editName} berhasil diperbarui!`, 'success');
      }

      // Tangani perubahan saldo (Adjustment Transaction)
      const diff = Number(editBalance) - originalBalance;
      if (diff !== 0) {
        const type = diff > 0 ? 'income' : 'withdrawal';
        const amount = Math.abs(diff);
        await api.post('/api/transactions', {
          type,
          amount,
          fundSource: categoryToEdit._id,
          notes: 'Penyesuaian Saldo Manual',
        });
      }

      setCategoryToEdit(null);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal memperbarui data', 'error');
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="space-y-6 pb-24 md:pb-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3 md:gap-4">
          {user?.profilePicture && (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-white shadow-md overflow-hidden bg-rose-50 shrink-0 hidden sm:block">
              <img src={getImageUrl(user.profilePicture)} alt="Profile" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">Halo, {user?.name} {user?.emoji || '👋'}</h1>
            <p className="italic text-sm md:text-base text-gray-500 dark:text-slate-400 mt-0.5">semangat nabungnya ya</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 text-white border-none relative overflow-hidden shadow-pink-200 dark:shadow-none shadow-xl">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <p className="text-pink-100 font-medium opacity-90 text-sm tracking-wide uppercase">Tabungan Bersama</p>
              <h2 className="text-4xl md:text-5xl font-extrabold mt-3 tracking-tight">Rp {totalTabungan.toLocaleString('id-ID')}</h2>
            </div>
            <div className="mt-8 flex justify-between items-end">
              <div>
                <p className="text-xs text-pink-100 font-medium">Uang di Pinjam atau di Luar</p>
                <p className="text-lg font-bold">Rp {uangKeluar.toLocaleString('id-ID')}</p>
              </div>
              <p className="text-xs md:text-sm text-pink-100/90 italic max-w-[50%] text-right font-medium">"{randomQuote}"</p>
            </div>
          </div>
          <Heart size={200} className="absolute -right-10 -bottom-10 text-white/10" />
        </Card>

        {/* Quick Actions */}
        <div className="col-span-1 flex flex-col gap-3">
          <div className="flex flex-row gap-3 flex-1">
            <button onClick={() => openTransactionModal('deposit')} className="btn-pill btn-pill-emerald flex-1 py-3 md:py-4 flex-col h-full rounded-3xl" style={{ borderRadius: '1.5rem' }}>
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center mb-1.5">
                <ArrowDownToLine size={22} />
              </div>
              <span className="text-sm font-bold tracking-wide">Nabung</span>
            </button>

            <button onClick={() => openTransactionModal('withdrawal')} className="btn-pill btn-pill-rose flex-1 py-3 md:py-4 flex-col h-full rounded-3xl" style={{ borderRadius: '1.5rem' }}>
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center mb-1.5">
                <ArrowUpFromLine size={22} />
              </div>
              <span className="text-sm font-bold tracking-wide">Pinjam</span>
            </button>
          </div>

          <div className="flex flex-row gap-3 flex-1">
            <button onClick={() => openTransactionModal('income')} className="btn-pill btn-pill-blue flex-1 py-3 md:py-4 flex-col h-full rounded-3xl" style={{ borderRadius: '1.5rem' }}>
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center mb-1.5">
                <PlusCircle size={22} />
              </div>
              <span className="text-sm font-bold tracking-wide">Pemasukan</span>
            </button>

            <button onClick={() => setIsCalculatorOpen(true)} className="btn-pill btn-pill-indigo flex-1 py-3 md:py-4 flex-col h-full rounded-3xl" style={{ borderRadius: '1.5rem' }}>
              <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center mb-1.5">
                <Calculator size={22} />
              </div>
              <span className="text-sm font-bold tracking-wide">Kalkulator</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden relative transition-colors duration-300">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Wallet className="text-indigo-500" size={20} /> Budget Bulanan
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Ketuk kartu untuk kelola dana</p>
          </div>
          <button onClick={() => setIsCategoryModalOpen(true)} className="w-9 h-9 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900/40 transition-all active:scale-95">
            <Plus size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* MASTER POOL: DOMPET GAJI — full width hero card */}
          <div
            onClick={() => setActiveCategory({ _id: 'gaji', name: gajiName, icon: gajiIcon, bal: gajiBalance, isGaji: true })}
            className="relative flex items-center p-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 rounded-2xl shadow-md overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
          >
            <Heart size={120} className="absolute -right-6 -bottom-6 text-white/10 pointer-events-none" />
            <div className="flex-1 z-10">
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Sumber Dana</span>
              <p className="text-white font-bold text-base mt-0.5">{gajiName}</p>
              <p className="text-white font-extrabold text-2xl tracking-tight">Rp {gajiBalance.toLocaleString('id-ID')}</p>
            </div>
            <div className="z-10 flex flex-col items-center gap-2">
              <span className="text-4xl drop-shadow-md">{gajiIcon}</span>
              <button
                onClick={(e) => { e.stopPropagation(); openEditModal({ _id: 'gaji', name: gajiName, icon: gajiIcon }); }}
                className="p-1.5 bg-white/20 hover:bg-white/40 rounded-xl transition-all"
              >
                <Pencil size={12} className="text-white" />
              </button>
            </div>
          </div>

          {/* DYNAMIC ENVELOPES — 2-column grid of horizontal cards */}
          {categories.length === 0 && (
            <div
              className="border-2 border-dashed border-indigo-200/60 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-indigo-400 dark:text-indigo-500/60 cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors"
              onClick={() => setIsCategoryModalOpen(true)}
            >
              <PlusCircle size={28} className="mb-2 opacity-60" />
              <p className="text-sm font-semibold">Buat Amplop Kategori</p>
              <p className="text-[11px] opacity-70 mt-0.5">Misal: Makan, Bensin, Cicilan</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {categories.map(cat => {
              const bal = getEnvelopeBalance(cat._id);
              const catTxs = budgetTransactions.filter(t => t.fundSource === cat._id);
              const totalIncome = catTxs.filter(t => t.type === 'income' || t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
              const pct = totalIncome > 0 ? Math.min(Math.max(bal, 0) / totalIncome, 1) : 0;
              const isLow = bal >= 0 && totalIncome > 0 && pct < 0.2;
              const isEmpty = bal <= 0;

              // Pick a card accent color based on index
              const accents = [
                'from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-100 dark:border-indigo-800/50',
                'from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 border-teal-100 dark:border-teal-800/50',
                'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800/50',
                'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-100 dark:border-purple-800/50',
                'from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-100 dark:border-rose-800/50',
                'from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 border-cyan-100 dark:border-cyan-800/50',
              ];
              const accentIdx = categories.indexOf(cat) % accents.length;

              return (
                <div
                  key={cat._id}
                  onClick={() => setActiveCategory({ ...cat, bal, totalIncome, pct, isGaji: false })}
                  className={`relative flex flex-col justify-between p-4 rounded-2xl border bg-gradient-to-br ${accents[accentIdx]} cursor-pointer active:scale-[0.97] transition-all shadow-sm hover:shadow-md overflow-hidden min-h-[120px]`}
                >
                  {/* Progress bar at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 rounded-b-2xl overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isEmpty ? 'bg-rose-400' : isLow ? 'bg-amber-400' : 'bg-indigo-400'}`}
                      style={{ width: `${Math.round(pct * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="text-3xl leading-none drop-shadow">{cat.icon}</span>
                    <ChevronRight size={15} className="text-gray-300 dark:text-slate-600 mt-1" />
                  </div>

                  <div className="mt-3">
                    <p className="text-gray-500 dark:text-slate-400 text-[11px] font-semibold truncate">{cat.name}</p>
                    <p className={`font-extrabold text-base tracking-tight ${isEmpty ? 'text-rose-500' : 'text-gray-800 dark:text-slate-100'}`}>
                      Rp {bal.toLocaleString('id-ID')}
                    </p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${isEmpty ? 'text-rose-400' : isLow ? 'text-amber-500' : 'text-gray-400 dark:text-slate-500'}`}>
                      {totalIncome > 0 ? `${Math.round(pct * 100)}% sisa` : 'Amplop Kosong'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION BOTTOM SHEET for active category */}
        {createPortal(
          <AnimatePresence>
            {activeCategory && (
              <>
                <motion.div
                  key="cat-backdrop"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                  onClick={() => setActiveCategory(null)}
                />
                <motion.div
                  key="cat-sheet"
                  initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.8 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.y > 100 || info.velocity.y > 400) setActiveCategory(null);
                  }}
                  className="fixed left-0 right-0 bottom-0 z-50 bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl border-t border-gray-100 dark:border-slate-800 max-w-lg mx-auto"
                >
                  <div className="p-6 pb-8">
                    {/* Pill handle — touch area for drag-to-dismiss */}
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-5 cursor-grab active:cursor-grabbing" />

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-3xl shadow-sm">
                        {activeCategory.icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-widest">{activeCategory.isGaji ? 'Sumber Dana' : 'Amplop'}</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-slate-100">{activeCategory.name}</p>
                        <p className={`text-xl font-extrabold ${activeCategory.bal < 0 ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                          Rp {activeCategory.bal.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      {activeCategory.isGaji ? (
                        <>
                          <button
                            onClick={() => { setActiveCategory(null); openTransactionModal('deposit', 'gaji'); }}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-all active:scale-95"
                          >
                            <ArrowDownToLine size={22} />
                            <span className="text-sm font-bold">Tambah Saldo</span>
                          </button>
                          <button
                            onClick={() => { setActiveCategory(null); openTransactionModal('withdrawal', 'gaji'); }}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-all active:scale-95"
                          >
                            <ArrowUpFromLine size={22} />
                            <span className="text-sm font-bold">Pakai Dana</span>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveCategory(null); openEditModal({ _id: 'gaji', name: activeCategory.name, icon: activeCategory.icon }); }}
                            className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 transition-all active:scale-95"
                          >
                            <Pencil size={16} />
                            <span className="text-sm font-semibold">Edit Nama & Ikon</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setActiveCategory(null); openTransactionModal('allocation', 'gaji', activeCategory._id); }}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 transition-all active:scale-95"
                          >
                            <ArrowDownToLine size={22} />
                            <span className="text-sm font-bold">Tambah Dana</span>
                          </button>
                          <button
                            onClick={() => { setActiveCategory(null); openTransactionModal('withdrawal', activeCategory._id); }}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-all active:scale-95"
                          >
                            <ArrowUpFromLine size={22} />
                            <span className="text-sm font-bold">Pakai Dana</span>
                          </button>
                          <button
                            onClick={() => { setActiveCategory(null); openEditModal(activeCategory); }}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-400 transition-all active:scale-95"
                          >
                            <Pencil size={20} />
                            <span className="text-sm font-semibold">Edit</span>
                          </button>
                          <button
                            onClick={() => { setActiveCategory(null); promptDeleteCategory(activeCategory._id, activeCategory.name); }}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-all active:scale-95"
                          >
                            <Trash2 size={20} />
                            <span className="text-sm font-semibold">Hapus</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
        <div className="bg-gradient-to-br from-rose-100 via-pink-50 to-pink-200 dark:from-slate-800 dark:via-slate-900 dark:to-rose-950/40 backdrop-blur-xl rounded-3xl shadow-lg border-2 border-white/80 dark:border-slate-800 overflow-hidden relative transition-colors duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-300/30 dark:bg-rose-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="bg-white/50 dark:bg-slate-900/60 backdrop-blur-md border-b border-white/60 dark:border-slate-800 px-5 py-4 flex items-center justify-between relative z-10 flex-wrap gap-2">
            <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="text-rose-400" size={20} /> Riwayat Terbaru
            </h3>
            <div className="flex items-center gap-2">
              {/* Tab switcher */}
              <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl">
                <button
                  onClick={() => setRecentTab('public')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${recentTab === 'public'
                      ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm'
                      : 'text-gray-500 dark:text-slate-400'
                    }`}
                >
                  🌟 Umum
                </button>
                <button
                  onClick={() => setRecentTab('budget')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${recentTab === 'budget'
                      ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm'
                      : 'text-gray-500 dark:text-slate-400'
                    }`}
                >
                  📂 Budget
                </button>
              </div>
              <button onClick={() => navigate('/history')} className="btn-pill btn-pill-rose btn-pill-sm">
                Lihat Semua <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="px-5 py-2 relative z-10">
            {/* PUBLIC TAB */}
            {recentTab === 'public' && (
              <>
                {transactions.length === 0 && (
                  <div className="text-center py-10 flex flex-col items-center gap-2">
                    <span className="text-6xl">📋</span>
                    <p className="font-bold text-gray-500 dark:text-slate-400">Belum ada transaksi</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Mulai nabung untuk melihat riwayat ✨</p>
                  </div>
                )}
                {transactions.map((trx) => (
                  <div key={trx._id} className="flex items-center gap-3 py-3 px-1 border-b border-rose-50/50 dark:border-slate-800/50 last:border-0 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors rounded-xl mx-[-4px] px-2">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white dark:border-slate-700 ${trx.type === 'deposit' ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-600' : trx.type === 'income' ? 'bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/30 text-blue-500' : 'bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/30 text-rose-500'}`}>
                      {trx.type === 'deposit' ? <ArrowDownToLine size={15} /> : trx.type === 'income' ? <PlusCircle size={15} /> : <ArrowUpFromLine size={15} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm truncate">{trx.user.name} <span className="ml-1.5 text-[11px] font-bold uppercase">{trx.type}</span></p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">{new Date(trx.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short' })} {trx.notes && `• ${trx.notes}`}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-extrabold text-sm ${trx.type === 'withdrawal' ? 'text-rose-500' : 'text-emerald-500'}`}>{trx.type === 'withdrawal' ? '−' : '+'} Rp {trx.amount.toLocaleString('id-ID')}</p>
                      {trx.proofOfTransfer && <button onClick={() => setImageModal(getImageUrl(trx.proofOfTransfer))} className="mt-1 flex items-center justify-end gap-1 w-full text-[10px] text-gray-400 dark:text-slate-500"><ImageIcon size={10} /> bukti</button>}
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* BUDGET TAB */}
            {recentTab === 'budget' && (
              <>
                {budgetTransactions.length === 0 && (
                  <div className="text-center py-10 flex flex-col items-center gap-2">
                    <span className="text-6xl">📂</span>
                    <p className="font-bold text-gray-500 dark:text-slate-400">Belum ada transaksi budget</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Coba tambah budget atau pakai dari amplop 🗂️</p>
                  </div>
                )}
                {budgetTransactions.slice(0, 5).map((trx) => {
                  const isTransfer = trx.isTransfer || (trx.notes && trx.notes.includes('Alokasi'));
                  return (
                    <div key={trx._id} className="flex items-center gap-3 py-3 px-1 border-b border-indigo-50/50 dark:border-slate-800/50 last:border-0 hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition-colors rounded-xl mx-[-4px] px-2">
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white dark:border-slate-700 ${
                          isTransfer ? 'bg-gray-100 dark:bg-slate-800 text-gray-500' :
                          trx.type === 'income' ? 'bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/30 text-indigo-500'
                          : 'bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/30 dark:to-rose-800/30 text-rose-500'
                        }`}>
                        {isTransfer ? <RefreshCcw size={15} /> : trx.type === 'income' ? <ArrowDownToLine size={15} /> : <ArrowUpFromLine size={15} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-slate-200 text-sm truncate">
                          {isTransfer ? (trx.type === 'income' ? 'Pindah (Masuk)' : 'Pindah (Keluar)') : trx.type === 'income' ? '↓ Masuk' : '↑ Keluar'} {trx.notes ? `• ${trx.notes}` : ''}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">{new Date(trx.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-extrabold text-sm ${isTransfer ? 'text-gray-500 font-medium' : trx.type === 'withdrawal' ? 'text-rose-500' : 'text-indigo-500'}`}>{trx.type === 'withdrawal' ? '−' : '+'} Rp {trx.amount.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

      </div>

      {createPortal(
        <AnimatePresence>
          {uploading && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl flex flex-col items-center justify-center shadow-2xl">
                <Activity size={32} className="text-rose-500 animate-pulse mb-4" />
                <h3 className="font-bold relative z-10 dark:text-slate-200">Menyimpan...</h3>
              </motion.div>
            </div>
          )}
          {imageModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setImageModal(null)}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="relative max-w-3xl w-full bg-white dark:bg-slate-800 rounded-2xl overflow-hidden p-2" onClick={e => e.stopPropagation()}>
                <button onClick={() => setImageModal(null)} className="btn-circle absolute top-4 right-4 bg-rose-500 hover:bg-rose-600 text-white p-1.5"><X size={18} /></button>
                <img src={imageModal} className="w-full max-h-[80vh] object-contain rounded-xl" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

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
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Nama Kategori</label>
            <input type="text"
              required
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              onInvalid={setIndonesianValidity}
              onInput={setIndonesianValidity}
              className="w-full px-4 py-3 border border-indigo-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none bg-indigo-50/30 dark:bg-slate-800 text-indigo-900 dark:text-slate-100 font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-500"
              placeholder="Contoh: Belanja Bulanan" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Pilih Ikon (Emoji)</label>
            <div className="flex gap-2 text-2xl flex-wrap">
              {CATEGORY_EMOJIS.map(em => (
                <button type="button" key={em} onClick={() => setCategoryIcon(em)} className={`p-2 rounded-xl transition-all ${categoryIcon === em ? 'bg-indigo-100 dark:bg-indigo-900/40 scale-110 shadow-sm border border-indigo-200 dark:border-indigo-800' : 'bg-gray-50 dark:bg-slate-800 opacity-50 hover:opacity-100'}`}>
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

      {/* Edit Category Modal */}
      <Modal isOpen={!!categoryToEdit} onClose={() => setCategoryToEdit(null)} title={`Edit ${categoryToEdit?._id === 'gaji' ? 'Dompet' : 'Budget'} ✏️`}>
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Nama Kategori</label>
            <input type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onInvalid={setIndonesianValidity}
              onInput={setIndonesianValidity}
              className="w-full px-4 py-3 border border-indigo-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none bg-indigo-50/30 dark:bg-slate-800 text-indigo-900 dark:text-slate-100 font-semibold placeholder:text-gray-400 dark:placeholder:text-slate-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Pilih Ikon (Emoji)</label>
            <div className="flex gap-2 text-2xl flex-wrap">
              {CATEGORY_EMOJIS.map(em => (
                <button type="button" key={em} onClick={() => setEditIcon(em)} className={`p-2 rounded-xl transition-all ${editIcon === em ? 'bg-indigo-100 dark:bg-indigo-900/40 scale-110 shadow-sm border border-indigo-200 dark:border-indigo-800' : 'bg-gray-50 dark:bg-slate-800 opacity-50 hover:opacity-100'}`}>
                  {em}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Edit Saldo</label>
            <CurrencyInput
              value={editBalance}
              onChange={(val) => setEditBalance(val)}
              className="w-full px-4 py-3 border border-indigo-100 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none bg-indigo-50/30 dark:bg-slate-800 text-indigo-900 dark:text-slate-100 font-bold font-mono placeholder:text-gray-400 dark:placeholder:text-slate-500"
              placeholder="0"
            />
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">*Jika nominal diubah, histori penyesuaian akan otomatis dicatat</p>
          </div>
          <Button type="submit" variant="primary" className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-lg rounded-xl shadow-[0_8px_20px_rgb(79,70,229,0.2)]" disabled={!editName || editBalance === ''}>
            Simpan Perubahan {editIcon}
          </Button>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !uploading && setIsModalOpen(false)} title={
        type === 'deposit' ? 'Nabung 💖' : type === 'income' ? 'Catat Pemasukan 🎉' : type === 'allocation' ? 'Tambah Budget 💧' : 'Catat Pemakaian 💸'
      }>
        <form onSubmit={handleTransactionSubmit} className="space-y-4 text-left">

          {/* ── Source Mode Picker (only for deposit & income) ── */}
          {(type === 'deposit' || type === 'income') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Sumber Dana</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setSourceMode('external'); setFundSource('tabungan_utama'); setToCategory(''); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${sourceMode === 'external'
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                    }`}
                >
                  <span className="text-2xl">💵</span>
                  <span>Dari Luar</span>
                  <span className="text-[10px] font-normal opacity-70 text-center">Uang masuk dari luar aplikasi</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSourceMode('internal'); setFundSource('gaji'); setToCategory(''); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-semibold ${sourceMode === 'internal'
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                    }`}
                >
                  <span className="text-2xl">🔄</span>
                  <span>Dari Internal</span>
                  <span className="text-[10px] font-normal opacity-70 text-center">Pindahkan dari saldo di aplikasi</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Pilih Sumber (only for internal mode) ── */}
          {(type === 'deposit' || type === 'income') && sourceMode === 'internal' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Pilih Sumber (Potong dari mana?)</label>
              <div className="relative">
                <div onClick={() => setIsSelectOpen(isSelectOpen === 'source' ? false : 'source')} className="w-full px-4 py-3 border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex justify-between items-center cursor-pointer">
                  <span className="font-medium text-indigo-900 dark:text-indigo-300">
                    {fundSource === 'gaji' ? '💼 Dompet Gaji'
                      : fundSource === 'tabungan_utama' ? '🌟 Tabungan Bersama'
                        : categories.find(c => c._id === fundSource)?.name || 'Pilih...'}
                  </span>
                  <ChevronDown size={16} className="text-indigo-400" />
                </div>
                {isSelectOpen === 'source' && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                    <div onClick={() => { setFundSource('gaji'); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer font-semibold text-emerald-700 dark:text-emerald-400 border-b border-gray-50 dark:border-slate-700">💼 Dompet Gaji (Rp {gajiBalance.toLocaleString('id-ID')})</div>
                    <div onClick={() => { setFundSource('tabungan_utama'); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer font-semibold text-indigo-700 dark:text-indigo-400 border-b border-gray-50 dark:border-slate-700">🌟 Tabungan Bersama (Rp {totalTabungan.toLocaleString('id-ID')})</div>
                    {categories.map(c => (
                      <div key={c._id} onClick={() => { setFundSource(c._id); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400 pl-8">{c.icon} {c.name} (Rp {getEnvelopeBalance(c._id).toLocaleString('id-ID')})</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Pilih Tujuan (for both modes of deposit/income) ── */}
          {(type === 'deposit' || type === 'income') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {sourceMode === 'internal' ? 'Pilih Tujuan (Kemana uang pergi?)' : 'Pilih Tujuan'}
              </label>
              <div className="relative">
                <div onClick={() => setIsSelectOpen(isSelectOpen === 'dest' ? false : 'dest')} className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-xl flex justify-between items-center cursor-pointer">
                  <span className="font-medium text-gray-800 dark:text-slate-100 truncate">
                    {sourceMode === 'internal'
                      ? (toCategory
                        ? (categories.find(c => c._id === toCategory)?.name
                          || budgets.find(b => b._id === toCategory)?.title
                          || 'Pilih tujuan...')
                        : 'Pilih tujuan...')
                      : (fundSource === 'tabungan_utama' && budgetId
                        ? `🎯 ${budgets.find(b => b._id === budgetId)?.title || 'Target'}`
                        : fundSource === 'tabungan_utama' ? '🌟 Tabungan Bersama'
                          : fundSource === 'gaji' ? '💼 Dompet Gaji'
                            : categories.find(c => c._id === fundSource)?.name || 'Pilih tujuan...')}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
                {isSelectOpen === 'dest' && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {sourceMode === 'internal' ? (
                      // Internal mode: show categories + budget targets as destination
                      <>
                        {categories.length > 0 && (
                          <>
                            <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-4 py-2 bg-gray-50 dark:bg-slate-900/50">Budget Bulanan</div>
                            {categories.map(c => (
                              <div key={c._id} onClick={() => { setToCategory(c._id); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400 border-b border-gray-50 dark:border-slate-700">{c.icon} {c.name}</div>
                            ))}
                          </>
                        )}
                        {budgets.length > 0 && (
                          <>
                            <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-4 py-2 bg-gray-50 dark:bg-slate-900/50">Tabungan Target 🎯</div>
                            {budgets.map(b => (
                              <div key={b._id} onClick={() => { setToCategory(b._id); setBudgetId(b._id); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/30 cursor-pointer font-semibold text-rose-600 dark:text-rose-400 border-b border-gray-50 dark:border-slate-700">🎯 {b.title} (Rp {(b.currentAmount || 0).toLocaleString('id-ID')} / {(b.targetAmount || 0).toLocaleString('id-ID')})</div>
                            ))}
                          </>
                        )}
                        {categories.length === 0 && budgets.length === 0 && (
                          <p className="text-center text-sm text-gray-400 py-4">Belum ada kategori atau target</p>
                        )}
                      </>
                    ) : (
                      // External mode: tabungan utama, gaji, categories, + budget targets
                      <>
                        <div onClick={() => { setFundSource('tabungan_utama'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer font-bold text-emerald-600 dark:text-emerald-400 border-b border-gray-50 dark:border-slate-700">🌟 Tabungan Bersama</div>
                        <div onClick={() => { setFundSource('gaji'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer font-bold text-emerald-700 dark:text-emerald-300 border-b border-gray-50 dark:border-slate-700">💼 Dompet Gaji</div>
                        {budgets.length > 0 && (
                          <>
                            <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-4 py-2 bg-gray-50 dark:bg-slate-900/50">Tabungan Target 🎯</div>
                            {budgets.map(b => (
                              <div key={b._id} onClick={() => { setFundSource('tabungan_utama'); setBudgetId(b._id); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/30 cursor-pointer font-semibold text-rose-600 dark:text-rose-400 border-b border-gray-50 dark:border-slate-700 pl-8">🎯 {b.title} (Rp {(b.currentAmount || 0).toLocaleString('id-ID')} / {(b.targetAmount || 0).toLocaleString('id-ID')})</div>
                            ))}
                          </>
                        )}
                        {categories.length > 0 && (
                          <>
                            <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-4 py-2 bg-gray-50 dark:bg-slate-900/50">Budget Bulanan</div>
                            {categories.map(c => (
                              <div key={c._id} onClick={() => { setFundSource(c._id); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400 pl-8">{c.icon} {c.name}</div>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Original flow for allocation & withdrawal ── */}
          {(type === 'allocation' || type === 'withdrawal') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {type === 'allocation' ? 'Tujuan Aliran Dana' : 'Pilih Sumber Dana'}
              </label>
              <div className="relative">
                <div onClick={() => setIsSelectOpen(isSelectOpen === 'main' ? false : 'main')} className={`w-full px-4 py-3 border rounded-xl flex justify-between items-center cursor-pointer ${type === 'allocation' ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800' : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'}`}>
                  <span className="truncate font-medium text-gray-800 dark:text-slate-100">
                    {type === 'allocation' ? (
                      categories.find(c => c._id === toCategory)?.name || 'Pilih Amplop...'
                    ) : fundSource === 'tabungan_utama' && budgetId ? budgets.find(b => b._id === budgetId)?.title
                      : fundSource === 'tabungan_utama' ? '🌟 Tabungan Bersama'
                        : fundSource === 'gaji' ? '💼 Dompet Gaji'
                          : categories.find(c => c._id === fundSource)?.name || '...'}
                  </span>
                  <ChevronDown size={18} className="text-gray-400 dark:text-slate-500" />
                </div>
                {isSelectOpen === 'main' && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                    {type === 'allocation' ? (
                      <div className="py-2">
                        <div className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-4 py-1">Pilih Amplop Penerima</div>
                        {categories.map(c => (
                          <div key={c._id} onClick={() => { setToCategory(c._id); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer border-b border-gray-50 dark:border-slate-900/50 text-indigo-700 dark:text-indigo-400 font-semibold">{c.icon} {c.name}</div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <div onClick={() => { setFundSource('tabungan_utama'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 cursor-pointer border-b border-gray-50 dark:border-slate-900/50 text-emerald-600 dark:text-emerald-400 font-bold transition-colors">🌟 Tabungan Bersama</div>
                        <div onClick={() => { setFundSource('gaji'); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 cursor-pointer border-b border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50/30 dark:bg-emerald-900/20">💼 Dompet Gaji</div>
                        {categories.map(c => (
                          <div key={c._id} onClick={() => { setFundSource(c._id); setBudgetId(''); setIsSelectOpen(false); }} className="px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer border-b border-gray-50 dark:border-slate-900/50 text-indigo-700 dark:text-indigo-400 font-semibold truncate pl-8">{c.icon} {c.name}</div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nominal (Rp)</label>
            <CurrencyInput
              required
              value={amount}
              onChange={setAmount}
              className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 dark:bg-slate-800 text-xl font-extrabold text-indigo-900 dark:text-indigo-400 shadow-inner dark:shadow-none"
              placeholder="1.000.000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Keterangan Singkat</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 outline-none bg-gray-50 dark:bg-slate-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500" placeholder={type === 'allocation' ? 'Sisihkan gaji buat...' : 'Keterangan'} />
          </div>

          {type !== 'allocation' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bukti Gambar (Opsional)</label>
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-sm dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 dark:file:bg-rose-900/30 file:text-rose-600 dark:file:text-rose-400" />
            </div>
          )}

          <Button
            type="submit"
            variant={type === 'withdrawal' ? 'outline' : 'primary'}
            className={`w-full mt-6 py-3 text-lg rounded-xl shadow-md ${type === 'allocation' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
            disabled={(type === 'allocation' && !toCategory) || (sourceMode === 'internal' && (type === 'deposit' || type === 'income') && !toCategory)}
          >
            {uploading ? 'Menyimpan...' : type === 'allocation' ? 'Transfer Saldo' : 'Konfirmasi Transaksi'}
          </Button>
        </form>
      </Modal>

      <CalculatorModal isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />
    </motion.div>
  );
};

export default Dashboard;
