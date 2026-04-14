import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { motion } from 'framer-motion';
import { Heart, ArrowDownToLine, ArrowUpFromLine, Activity } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
        const [budgetsRes, transactionsRes] = await Promise.all([
          api.get('/api/budget'),
          api.get('/api/transactions'),
        ]);
        setBudgets(budgetsRes.data);
        setTransactions(transactionsRes.data.reverse().slice(0, 5)); // Last 5 transactions
    } catch (error) {
        console.error(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalTabungan = budgets.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const uangKeluar = transactions.filter(t => t.type === 'withdrawal').reduce((acc, curr) => acc + curr.amount, 0);

  const openTransactionModal = (txType) => {
    setType(txType);
    setIsModalOpen(true);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      await api.post('/api/transactions', {
        amount: Number(amount),
        type,
        budgetId: budgetId || undefined,
        notes,
        proofOfTransfer: ''
      });

      showToast(type === 'deposit' ? 'Asyik! Berhasil nabung.' : 'Uang pinjaman dicatat.', 'success');
      setIsModalOpen(false);
      setAmount('');
      setNotes('');
      setBudgetId('');
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Halo, {user?.name} 💖</h1>
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

        {/* Quick Actions Action Pads */}
        <div className="col-span-1 flex flex-col gap-4">
            <button 
                onClick={() => openTransactionModal('deposit')}
                className="flex-1 glass bg-white/60 hover:bg-white/90 transition-all rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-emerald-100 group"
            >
                <div className="w-14 h-14 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ArrowDownToLine size={28} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Nabung</h3>
                <p className="text-xs text-gray-500">Tambah saldo pernikahan</p>
            </button>

            <button 
                onClick={() => openTransactionModal('withdrawal')}
                className="flex-1 glass bg-white/60 hover:bg-white/90 transition-all rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-rose-100 group"
            >
                <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ArrowUpFromLine size={28} />
                </div>
                <h3 className="font-bold text-gray-800 text-lg">Pinjam Uang</h3>
                <p className="text-xs text-gray-500">Ambil/pinjam uang tabungan</p>
            </button>
        </div>
      </div>

      <Card className="glass bg-white/80">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Activity className="text-rose-400" /> Transaksi Terakhir
          </h3>
        </div>
        
        <div className="space-y-3">
          {transactions.length === 0 && (
            <p className="text-center text-gray-500 py-6">Belum ada transaksi, mulailah menabung!</p>
          )}
          {transactions.map((trx) => (
            <div key={trx._id} className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${trx.type === 'deposit' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                  {trx.type === 'deposit' ? <ArrowDownToLine size={20} /> : <ArrowUpFromLine size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{trx.user.name}</p>
                  <p className="text-xs text-gray-500">{new Date(trx.createdAt).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${trx.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {trx.type === 'deposit' ? '+ Rp' : '- Rp'} {trx.amount.toLocaleString('id-ID')}
                </p>
                <p className="text-[11px] text-gray-400 font-medium">{trx.type === 'deposit' ? 'Nabung' : 'Dipinjam'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Transaction Modal directly from Dashboard */}
      <Modal isOpen={isModalOpen} onClose={() => !uploading && setIsModalOpen(false)} title={type === 'deposit' ? "Catat Nabung 💖" : "Catat Pinjaman Uang 💸"}>
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
            <select
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none transition-all bg-gray-50 focus:bg-white"
            >
              <option value="">-- Masukkan ke Tabungan Bersama (Utama) --</option>
              {budgets.map(b => (
                <option key={b._id} value={b._id}>{b.title} (Kurang Rp {(b.targetAmount - b.currentAmount).toLocaleString('id-ID')})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Keterangan</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder={type === 'deposit' ? "Menabung uang sisa belanja..." : "Pinjam untuk benerin motor"}
            />
          </div>

          <Button type="submit" variant={type === 'deposit' ? 'primary' : 'outline'} className="w-full mt-6 py-3 text-lg rounded-xl">
            {uploading ? 'Menyimpan...' : (type === 'deposit' ? 'Simpan Tabungan' : 'Catat Uang Dipinjam')}
          </Button>
        </form>
      </Modal>

    </motion.div>
  );
};

export default Dashboard;
