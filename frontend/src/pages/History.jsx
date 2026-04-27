import { useEffect, useState } from 'react';
import api, { getImageUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, PlusCircle, Image as ImageIcon, X, ArrowDownToLine, ArrowUpFromLine, Wallet, RefreshCcw } from 'lucide-react';
import { CategoryIcon } from '../components/ui/CategoryIcon';

const History = () => {
  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'budget'

  // Tabungan Umum (public) state
  const [transactions, setTransactions] = useState([]);
  const [filterName, setFilterName] = useState('Semua');

  // Budget Bulanan (private) state
  const [budgetTransactions, setBudgetTransactions] = useState([]);
  const [filterCategory, setFilterCategory] = useState('Semua');

  const [imageModal, setImageModal] = useState(null);
  const [loading, setLoading] = useState(false);

  const { showToast } = useToast();

  const fetchPublic = async () => {
    try {
      const res = await api.get('/api/transactions');
      setTransactions(res.data.reverse());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/transactions/budget-all');
      setBudgetTransactions(res.data);
    } catch (err) {
      showToast('Gagal memuat riwayat budget', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublic();
  }, []);

  useEffect(() => {
    if (activeTab === 'budget') fetchBudget();
  }, [activeTab]);

  // ── Public tab logic ──────────────────────────────────────────────
  const uniqueNames = ['Semua', ...new Set(transactions.map(t => t.user?.name).filter(Boolean))];
  const filteredPublic = filterName === 'Semua'
    ? transactions
    : transactions.filter(t => t.user?.name === filterName);

  // ── Budget tab logic ──────────────────────────────────────────────
  const uniqueCategories = ['Semua', ...new Set(budgetTransactions.map(t => t.categoryName).filter(Boolean))];
  const filteredBudget = filterCategory === 'Semua'
    ? budgetTransactions
    : budgetTransactions.filter(t => t.categoryName === filterCategory);

  const isTransfer = (trx) => trx.isTransfer || (trx.notes && trx.notes.includes('Alokasi'));

  const getBudgetIcon = (trx) => {
    if (isTransfer(trx)) return <RefreshCcw size={16} />;
    if (trx.fundSource === 'gaji') {
      return trx.type === 'withdrawal'
        ? <ArrowUpFromLine size={16} />
        : <ArrowDownToLine size={16} />;
    }
    if (trx.type === 'income') return <ArrowDownToLine size={16} />;
    if (trx.type === 'withdrawal') return <ArrowUpFromLine size={16} />;
    return <Wallet size={16} />;
  };

  const getBudgetColor = (trx) => {
    if (isTransfer(trx)) return 'bg-gray-100 dark:bg-slate-800 text-gray-500';
    if (trx.type === 'income') return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
    if (trx.type === 'withdrawal') return 'bg-rose-100 dark:bg-rose-900/30 text-rose-500';
    return 'bg-gray-100 dark:bg-slate-800 text-gray-500';
  };

  const getBudgetAmountColor = (trx) => {
    if (isTransfer(trx)) return 'text-gray-500 font-medium';
    if (trx.type === 'income') return 'text-indigo-500';
    if (trx.type === 'withdrawal') return 'text-rose-500';
    return 'text-gray-500';
  };

  const getBudgetLabel = (trx) => {
    if (isTransfer(trx)) {
      if (trx.type === 'withdrawal') return 'Pindah Dana (Keluar)';
      if (trx.type === 'income') return 'Pindah Dana (Masuk)';
      return 'Transfer Internal';
    }
    if (trx.fundSource === 'gaji' && trx.type === 'withdrawal') return 'Keluar dari Gaji';
    if (trx.type === 'income') return <span className="inline-flex items-center gap-1">Masuk → <CategoryIcon name={trx.categoryIcon} size={14} className="flex-shrink-0" /> <span className="truncate">{trx.categoryName}</span></span>;
    if (trx.type === 'withdrawal') return <span className="inline-flex items-center gap-1">Pakai dari <CategoryIcon name={trx.categoryIcon} size={14} className="flex-shrink-0" /> <span className="truncate">{trx.categoryName}</span></span>;
    return trx.categoryName;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">Riwayat Transaksi 📜</h1>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('public')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'public'
              ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          🌟 Tabungan Umum
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'budget'
              ? 'bg-white dark:bg-slate-700 text-indigo-500 shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
          }`}
        >
          📂 Budget Bulanan
        </button>
      </div>

      {/* ── PUBLIC TAB ── */}
      {activeTab === 'public' && (
        <>
          {/* Name Filter Pills */}
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

          <Card>
            <div className="space-y-1">
              {filteredPublic.length === 0 && (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                  <span className="text-7xl">📋</span>
                  <p className="font-bold text-gray-600 dark:text-slate-300 text-lg">Belum ada transaksi</p>
                  <p className="text-sm text-gray-400 dark:text-slate-500 max-w-xs">Mulai nabung bareng untuk melihat riwayat transaksi di sini ✨</p>
                </div>
              )}
              {filteredPublic.map((trx) => (
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
                        className="flex items-center gap-1 mt-1 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 font-semibold bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full min-h-[30px] transition-colors"
                      >
                        <ImageIcon size={13} /> Lihat Bukti
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ── BUDGET TAB ── */}
      {activeTab === 'budget' && (
        <>
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all min-h-[38px] ${
                  filterCategory === cat
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-indigo-100 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <Card>
            <div className="space-y-1">
              {loading && (
                <p className="text-center text-gray-400 dark:text-slate-500 py-8 animate-pulse">Memuat data...</p>
              )}
              {!loading && filteredBudget.length === 0 && (
                <div className="text-center py-16 flex flex-col items-center gap-3">
                  <span className="text-7xl">📂</span>
                  <p className="font-bold text-gray-600 dark:text-slate-300 text-lg">Belum ada transaksi budget</p>
                  <p className="text-sm text-gray-400 dark:text-slate-500 max-w-xs">Coba lakukan "Sedot Gaji" atau "Pakai" dari kategori amplop di Dashboard 📂</p>
                </div>
              )}
              {!loading && filteredBudget.map((trx) => (
                <div key={trx._id} className="flex flex-row justify-between items-center p-3 sm:p-4 hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 rounded-2xl transition-colors border-b border-gray-50 dark:border-slate-800 last:border-0 gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 w-2/3">
                    <div className={`p-2 sm:p-3 rounded-2xl flex-shrink-0 ${getBudgetColor(trx)}`}>
                      {getBudgetIcon(trx)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-gray-800 dark:text-slate-200 text-sm truncate">{getBudgetLabel(trx)}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{new Date(trx.createdAt).toLocaleString('id-ID', {day:'numeric', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit'})}</p>
                      {trx.notes && <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">{trx.notes}</p>}
                    </div>
                  </div>

                  <div className="flex flex-col items-end flex-shrink-0 w-1/3">
                    <p className={`font-bold text-sm sm:text-base ${getBudgetAmountColor(trx)}`}>
                      {trx.type === 'withdrawal' ? '− Rp' : '+ Rp'} {trx.amount.toLocaleString('id-ID')}
                    </p>
                    <p className="text-right text-[11px] text-gray-500 dark:text-slate-400 font-medium truncate max-w-[100px] inline-flex items-center justify-end gap-1">
                      <CategoryIcon name={trx.categoryIcon} size={12} className="flex-shrink-0" /> <span className="truncate">{trx.categoryName}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ── Image Modal ── */}
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
