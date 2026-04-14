import { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, Star } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
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
    fetchData();
  }, []);

  const totalSavings = budgets.reduce((acc, curr) => acc + curr.currentAmount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Halo, {user?.name} 🌸</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-br from-rose-400 to-pink-500 text-white border-none relative overflow-hidden">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <p className="text-pink-100 font-medium opacity-90">Total Tabungan Bersama</p>
              <h2 className="text-4xl font-bold mt-2">Rp {totalSavings.toLocaleString('id-ID')}</h2>
            </div>
            <div className="mt-8">
              <p className="text-sm text-pink-100 italic">"Sedikit demi sedikit, lama-lama menjadi bukit."</p>
            </div>
          </div>
          <Wallet size={160} className="absolute -right-6 -bottom-8 text-white/10" />
        </Card>

        <Card className="flex flex-col justify-center items-center text-center bg-white">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <Star size={32} />
          </div>
          <h3 className="text-gray-500 font-medium">Target Aktif</h3>
          <p className="text-2xl font-bold text-gray-800 mt-1">{budgets.length}</p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Aktivitas Terakhir</h3>
        </div>
        
        <div className="space-y-4">
          {transactions.length === 0 && (
            <p className="text-center text-gray-500 py-4">Belum ada transaksi mulailah menabung!</p>
          )}
          {transactions.map((trx) => (
            <div key={trx._id} className="flex justify-between items-center p-4 hover:bg-pink-50/50 rounded-2xl transition-colors">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${trx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {trx.type === 'deposit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{trx.user.name}</p>
                  <p className="text-sm text-gray-500">{new Date(trx.createdAt).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${trx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {trx.type === 'deposit' ? '+' : '-'} Rp {trx.amount.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-gray-500">{trx.notes || 'Tanpa catatan'}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default Dashboard;
