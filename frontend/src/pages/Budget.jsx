import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { motion } from 'framer-motion';
import { Plus, Target, Calendar } from 'lucide-react';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const { showToast } = useToast();

  const fetchBudgets = async () => {
    try {
      const res = await api.get('/api/budget');
      setBudgets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/budget', {
        title,
        targetAmount: Number(targetAmount),
        deadline,
      });
      showToast('Target tabungan berhasil dibuat!', 'success');
      setIsModalOpen(false);
      setTitle('');
      setTargetAmount('');
      setDeadline('');
      fetchBudgets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Terjadi kesalahan', 'error');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Target Tabungan Nikah 💖</h1>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={18} /> Buat Target
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgets.map((budget) => {
          const progress = Math.min((budget.currentAmount / budget.targetAmount) * 100, 100);
          return (
            <Card key={budget._id} className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{budget.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Calendar size={14} />
                    <span>{budget.deadline ? new Date(budget.deadline).toLocaleDateString('id-ID') : 'Tanpa batas waktu'}</span>
                  </div>
                </div>
                <div className="p-2 bg-pink-100 text-pink-500 rounded-lg">
                  <Target size={24} />
                </div>
              </div>

              <div className="mb-2 flex justify-between text-sm font-medium">
                <span className="text-emerald-500">Rp {budget.currentAmount.toLocaleString('id-ID')}</span>
                <span className="text-gray-400">Rp {budget.targetAmount.toLocaleString('id-ID')}</span>
              </div>
              
              <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-rose-400 to-pink-500 h-3 rounded-full"
                />
              </div>
              <p className="text-right text-xs text-gray-500">{progress.toFixed(1)}% Tercapai</p>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Target Baru">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Target</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-200 outline-none"
              placeholder="Misal: Liburan ke Bali"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Nominal (Rp)</label>
            <input
              type="number"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-200 outline-none"
              placeholder="5000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tenggat Waktu</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-rose-200 outline-none"
            />
          </div>
          <Button type="submit" className="w-full mt-4">Simpan Target</Button>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Budget;
