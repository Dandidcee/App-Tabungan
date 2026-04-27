import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { setIndonesianValidity } from '../utils/validation';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useContext(AuthContext);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        showToast('Login berhasil! Selamat datang.', 'success');
      } else {
        await register(name, email, password);
        showToast('Berhasil membuat akun', 'success');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Terjadi kesalahan';
      alert(`[DEBUG] Error: ${msg} | URL: http://144.91.93.11:5050`);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-5">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm"
      >
        {/* App Icon + Title */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 20, stiffness: 400 }}
            className="w-20 h-20 rounded-3xl shadow-xl overflow-hidden mb-4"
          >
            <img src="/app-icon.png" alt="Tabungan Bersama" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 text-center">
            {isLogin ? 'Selamat Datang!' : 'Buat Akun Baru'}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 text-center">
            {isLogin ? 'Masuk ke Tabungan Bersama' : 'Mulai wujudkan rencana indah bersama'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-6 space-y-4 border border-pink-50 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Nama</label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-3.5 border border-gray-100 dark:border-slate-700 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onInvalid={setIndonesianValidity}
                    onInput={setIndonesianValidity}
                    className="flex-1 bg-transparent text-gray-800 dark:text-slate-100 text-base font-medium outline-none placeholder-gray-300 dark:placeholder-slate-600"
                    placeholder="Nama panggilanmu"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Email</label>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-3.5 border border-gray-100 dark:border-slate-700 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onInvalid={setIndonesianValidity}
                  onInput={setIndonesianValidity}
                  className="flex-1 bg-transparent text-gray-800 dark:text-slate-100 text-base font-medium outline-none placeholder-gray-300 dark:placeholder-slate-600"
                  placeholder="email@contoh.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Password</label>
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-3.5 border border-gray-100 dark:border-slate-700 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInvalid={setIndonesianValidity}
                  onInput={setIndonesianValidity}
                  className="flex-1 bg-transparent text-gray-800 dark:text-slate-100 text-base font-medium outline-none placeholder-gray-300 dark:placeholder-slate-600"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-rose-400 transition-colors shrink-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.97 }}
              className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-rose-400 to-rose-500 text-white font-bold text-base shadow-lg shadow-rose-200 dark:shadow-rose-900/30 disabled:opacity-60 transition-all"
            >
              {loading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar Sekarang')}
            </motion.button>
          </form>

          <div className="text-center pt-2">
            <span className="text-gray-400 dark:text-slate-500 text-sm">
              {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-rose-500 dark:text-rose-400 font-bold text-sm hover:underline"
            >
              {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
