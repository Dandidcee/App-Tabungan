import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Flower, Flower2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { setIndonesianValidity } from '../utils/validation';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const { login, register } = useContext(AuthContext);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(email, password);
        showToast('Login berhasil! Selamat datang.', 'success');
      } else {
        await register(name, email, password);
        showToast('Berhasil membuat akun', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Terjadi kesalahan', 'error');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring' }}
        className="w-full max-w-md"
      >
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Flower2 size={120} className="text-rose-500" />
          </div>
          
          <div className="relative z-10 text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full mb-4 text-rose-500">
              <Flower size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100">
              {isLogin ? 'Masuk ke TabungBersama' : 'Daftar Akun Baru'}
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-2">
              Mulai wujudkan rencana indah bersama-sama
            </p>
          </div>

          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Nama</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onInvalid={setIndonesianValidity}
                  onInput={setIndonesianValidity}
                  className="w-full px-4 py-3 rounded-xl border border-pink-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-rose-200 dark:text-slate-100 outline-none transition-all placeholder-gray-400 dark:placeholder-slate-500"
                  placeholder="Nama panggilangmu"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onInvalid={setIndonesianValidity}
                onInput={setIndonesianValidity}
                className="w-full px-4 py-3 rounded-xl border border-pink-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-rose-200 dark:text-slate-100 outline-none transition-all placeholder-gray-400 dark:placeholder-slate-500"
                placeholder="email@contoh.com"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onInvalid={setIndonesianValidity}
                  onInput={setIndonesianValidity}
                  className="w-full px-4 py-3 rounded-xl border border-pink-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-rose-200 dark:text-slate-100 outline-none transition-all pr-12 placeholder-gray-400 dark:placeholder-slate-500"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4 py-3 text-lg">
              {isLogin ? 'Masuk' : 'Daftar Sekarang'}
            </Button>
          </form>

          <div className="relative z-10 text-center mt-6">
            <span className="text-gray-500 dark:text-slate-400 text-sm">
              {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            </span>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-rose-500 dark:text-rose-400 font-semibold hover:underline"
            >
              {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
