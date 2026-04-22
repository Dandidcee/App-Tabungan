import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { motion } from 'framer-motion';
import { Plus, Target, Calendar } from 'lucide-react';
import CurrencyInput from '../components/ui/CurrencyInput';
import { setIndonesianValidity } from '../utils/validation';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [budgetToDelete, setBudgetToDelete] = useState(null);

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
        icon,
      });
      showToast('Target tabungan berhasil dibuat!', 'success');
      setIsModalOpen(false);
      setTitle('');
      setTargetAmount('');
      setDeadline('');
      setIcon('🎯');
      fetchBudgets();
    } catch (err) {
      showToast(err.response?.data?.message || 'Terjadi kesalahan', 'error');
    }
  };

  const confirmDeleteBudget = async () => {
    if (!budgetToDelete) return;
    try {
      await api.delete(`/api/budget/${budgetToDelete._id}`);
      showToast(`Target ${budgetToDelete.title} berhasil dihapus!`, 'success');
      setBudgetToDelete(null);
      fetchBudgets();
    } catch (err) {
      showToast('Gagal menghapus target', 'error');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100">Tabungan Target 🎯</h1>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="btn-circle md:!hidden w-11 h-11 btn-pill-rose text-white shadow-lg"
        >
          <Plus size={20} />
        </button>
        <Button onClick={() => setIsModalOpen(true)} className="!hidden md:!inline-flex items-center gap-2">
          <Plus size={18} /> Buat Target
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {budgets.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <span className="text-6xl mb-4">🎯</span>
            <h3 className="text-lg font-bold text-gray-500 dark:text-slate-400 mb-2">Anda belum memiliki Tabungan Target</h3>
            <p className="text-sm text-gray-400 dark:text-slate-500">Silahkan klik tombol <span className="font-bold text-rose-500">+</span> untuk menambahkan Target baru</p>
          </div>
        )}
        {budgets.map((budget) => {
          const progress = Math.min((budget.currentAmount / budget.targetAmount) * 100, 100);
          return (
            <Card key={budget._id} className="relative overflow-hidden group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{budget.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mt-1">
                    <Calendar size={14} />
                    <span>{budget.deadline ? new Date(budget.deadline).toLocaleDateString('id-ID') : 'Tanpa batas waktu'}</span>
                  </div>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-10 h-10 bg-pink-100 dark:bg-rose-900/30 text-2xl rounded-xl shadow-sm">
                      {budget.icon || '🎯'}
                    </div>
                    <button onClick={() => setBudgetToDelete(budget)} className="flex items-center justify-center w-10 h-10 text-rose-400 dark:text-rose-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-slate-700 transition-colors bg-rose-50 dark:bg-slate-800 rounded-xl shadow-sm" title="Hapus Target ini beserta saldonya">
                       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                 </div>
              </div>

               <div className="mb-2 flex justify-between text-sm font-medium">
                <span className="text-emerald-500 dark:text-emerald-400">Rp {budget.currentAmount.toLocaleString('id-ID')}</span>
                <span className="text-gray-400 dark:text-slate-500">Rp {budget.targetAmount.toLocaleString('id-ID')}</span>
              </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-rose-400 to-pink-500 h-3 rounded-full"
                />
              </div>
               <p className="text-right text-xs text-gray-500 dark:text-slate-400">{progress.toFixed(1)}% Tercapai</p>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Target Baru">
        <form onSubmit={handleCreate} className="space-y-4">
           <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nama Target</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onInvalid={setIndonesianValidity}
              onInput={setIndonesianValidity}
              className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-200 dark:bg-slate-800 dark:text-slate-100 outline-none"
              placeholder="Misal: Liburan ke Bali"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Target Nominal (Rp)</label>
            <CurrencyInput
              required
              value={targetAmount}
              onChange={setTargetAmount}
              className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-200 dark:bg-slate-800 dark:text-slate-100 outline-none"
              placeholder="5.000.000"
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Pilih Ikon (Emoji)</label>
             <div className="flex gap-2 text-2xl flex-wrap">
               {['🎯', '✈️', '🏠', '💍', '🚗', '🎓', '🏥', '🎉', '💻', '💵'].map(em => (
                 <button type="button" key={em} onClick={() => setIcon(em)} className={`p-2 rounded-xl transition-all ${icon === em ? 'bg-pink-100 dark:bg-rose-900/40 scale-110 shadow-sm border border-pink-200 dark:border-rose-800' : 'bg-gray-50 dark:bg-slate-800 opacity-50 hover:opacity-100'}`}>
                   {em}
                 </button>
               ))}
             </div>
           </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Tenggat Waktu</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-2 border dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-200 dark:bg-slate-800 dark:text-slate-100 outline-none"
            />
          </div>
          <Button type="submit" className="w-full mt-4">Simpan Target</Button>
        </form>
      </Modal>

      {/* Delete Budget Confirmation Modal */}
      <Modal isOpen={!!budgetToDelete} onClose={() => setBudgetToDelete(null)} title="Hapus Target Tabungan">
         <div className="text-center p-2 space-y-4">
             <div className="mx-auto w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400 rounded-full flex items-center justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
             </div>
             <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Apakah anda yakin ingin menghapus tujuan ini, semua progres anda akan di hapus</p>
             
             <div className="flex gap-3 mt-6">
                <Button onClick={() => setBudgetToDelete(null)} variant="outline" className="flex-1 py-3 bg-gray-50 dark:bg-slate-800 border-0">Batal</Button>
                <Button onClick={confirmDeleteBudget} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/20">
                   Lanjutkan
                </Button>
             </div>
         </div>
      </Modal>
    </motion.div>
  );
};

export default Budget;
