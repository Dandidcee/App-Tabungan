import { useEffect, useState, useMemo } from 'react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { PieChart as PieChartIcon, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react';

const Recap = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filterMode, setFilterMode] = useState('1_month'); // '1_month', '3_months', 'custom'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger chart animation every time data finishes loading/changing
  useEffect(() => {
    setShowChart(false);
    if (!loading) {
      const t = setTimeout(() => setShowChart(true), 150);
      return () => clearTimeout(t);
    }
  }, [loading, filterMode, customStart, customEnd]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch private transactions
      const res = await api.get('/api/transactions/budget-all');
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Calculate Date
  const { filteredTxs, totalIncome, totalExpense } = useMemo(() => {
    let income = 0;
    let expense = 0;

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let cutoffStart = null;
    let cutoffEnd = null;

    if (filterMode === '1_month') {
      cutoffStart = startOfThisMonth;
    } else if (filterMode === '3_months') {
      cutoffStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (filterMode === 'custom' && customStart && customEnd) {
      cutoffStart = new Date(customStart);
      cutoffEnd = new Date(customEnd);
      cutoffEnd.setHours(23, 59, 59, 999);
    }

    const validTxs = transactions.filter(tx => {
      // Ignore allocation / Sedot Gaji
      if (tx.type === 'allocation') return false;

      const txDate = new Date(tx.createdAt);
      if (cutoffStart && txDate < cutoffStart) return false;
      if (cutoffEnd && txDate > cutoffEnd) return false;
      
      return true;
    });

    validTxs.forEach(tx => {
      if (tx.type === 'deposit' || tx.type === 'income') {
        income += tx.amount;
      } else if (tx.type === 'withdrawal') {
        expense += tx.amount;
      }
    });

    return { filteredTxs: validTxs, totalIncome: income, totalExpense: expense };
  }, [transactions, filterMode, customStart, customEnd]);

  // SVG Chart calculation
  const total = totalIncome + totalExpense;
  const incomePercent = total === 0 ? 0 : Math.round((totalIncome / total) * 100);
  const expensePercent = total === 0 ? 0 : 100 - incomePercent;
  
  // Circumference of SVG circle where r=16 -> c = 2 * PI * 15.9155 ≈ 100
  const circumference = 2 * Math.PI * 15.9155;
  const incomeLength = (incomePercent * circumference) / 100;
  const expenseLength = (expensePercent * circumference) / 100;
  
  const incomeDasharray = `${incomeLength} ${circumference}`;
  const expenseDasharray = `${expenseLength} ${circumference}`;
  // To start the expense dash immediately after the income dash, we offset it backwards
  const expenseOffset = -incomeLength;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 hover:scale-110 transition-transform">
          <PieChartIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">Rekap Pribadi</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Analisis Pemasukan & Pengeluaran</p>
        </div>
      </div>

      <Card className="p-4 md:p-6 bg-white dark:bg-slate-900/80 backdrop-blur border-none shadow-xl">
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center border-b border-gray-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-xl self-start w-full md:w-auto overflow-x-auto overflow-y-hidden">
            <button
              onClick={() => setFilterMode('1_month')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${filterMode === '1_month' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setFilterMode('3_months')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${filterMode === '3_months' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              3 Bulan
            </button>
            <button
              onClick={() => setFilterMode('custom')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${filterMode === 'custom' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kustom Waktu
            </button>
          </div>

          {filterMode === 'custom' && (
            <div className="flex items-center w-full gap-2 md:ml-auto md:w-auto animate-in slide-in-from-right-4 fade-in">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full md:w-36 text-sm px-3 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-800" />
              <span className="text-gray-400">-</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full md:w-36 text-sm px-3 py-2 border dark:border-slate-700 rounded-lg dark:bg-slate-800" />
            </div>
          )}
        </div>

        {/* Chart Section */}
        <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
          {/* SVG Donut */}
          <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0">
            <svg viewBox="0 0 42 42" className="w-full h-full transform -rotate-90">
              <circle cx="21" cy="21" r="15.9155" fill="transparent" stroke="#f1f5f9" strokeWidth="6" className="dark:stroke-slate-800 transition-all duration-700" />
              {total > 0 && (
                <>
                  <circle
                    cx="21" cy="21" r="15.9155" fill="transparent" stroke="#10b981" strokeWidth="6"
                    strokeDasharray={showChart ? incomeDasharray : `0 ${circumference}`} 
                    strokeDashoffset="0" 
                    className="transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  />
                  <circle
                    cx="21" cy="21" r="15.9155" fill="transparent" stroke="#f43f5e" strokeWidth="6"
                    strokeDasharray={showChart ? expenseDasharray : `0 ${circumference}`} 
                    strokeDashoffset={showChart ? expenseOffset : 0} 
                    className="transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  />
                </>
              )}
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center flex-col text-center rotate-0 transition-all duration-700 delay-300 ${showChart ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
               {total > 0 ? (
                 <>
                  <span className="text-3xl font-extrabold text-gray-800 dark:text-slate-100">{totalIncome > totalExpense ? '📈' : '📉'}</span>
                  <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 mt-1">Sisa Nett</span>
                  <span className="text-base md:text-xl font-bold text-gray-800 dark:text-slate-200">
                    Rp {Math.abs(totalIncome - totalExpense).toLocaleString('id-ID')}
                  </span>
                 </>
               ) : (
                 <span className="text-sm text-gray-400 font-medium">Belum ada<br/>Data</span>
               )}
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full md:flex-1">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-500">
                <TrendingUp size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Total Pemasukan</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-500 mb-1">Rp {totalIncome.toLocaleString('id-ID')}</h3>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 font-semibold">{incomePercent}% dari Total</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 flex items-start gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-500">
                <TrendingDown size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-rose-800 dark:text-rose-400">Total Pengeluaran</p>
                <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-500 mb-1">Rp {totalExpense.toLocaleString('id-ID')}</h3>
                <p className="text-xs text-rose-600/70 dark:text-rose-400/60 font-semibold">{expensePercent}% dari Total</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Short History */}
      <h3 className="font-bold text-gray-800 dark:text-slate-200 mt-6 md:mt-10 mb-2">Histori Terkait</h3>
      <div className="space-y-3">
        {loading ? (
             <p className="text-gray-400 text-center py-4">Memuat data...</p>
        ) : filteredTxs.length === 0 ? (
             <p className="text-gray-400 text-center py-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-dashed border-gray-200 dark:border-slate-800">Tidak ada riwayat pada periode ini.</p>
        ) : (
            filteredTxs.slice(0, 10).map((tx) => (
                <div key={tx._id} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-50 dark:border-slate-800/60">
                    <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                        tx.type === 'deposit' || tx.type === 'income' ? 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900/30' : 
                        tx.type === 'withdrawal' ? 'bg-rose-100 text-rose-500 dark:bg-rose-900/30' : 'bg-gray-100 text-gray-500 dark:bg-slate-800'
                    }`}>
                        {tx.type === 'deposit' || tx.type === 'income' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 dark:text-slate-200 capitalize text-sm">{tx.notes || (tx.type === 'withdrawal' ? 'Pinjaman/Pakai' : 'Pemasukan')}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{new Date(tx.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                    </div>
                    </div>
                    <div className="text-right">
                        <span className={`font-bold text-sm ${
                        tx.type === 'deposit' || tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                        {tx.type === 'deposit' || tx.type === 'income' ? '+' : '-'}Rp {tx.amount.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default Recap;
