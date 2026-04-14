import { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../context/AuthContext';
import { Heart, Activity, Target, LogOut, Bell, User, PieChart, Menu, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ThemeToggle from '../ui/ThemeToggle';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  const BadgeCount = ({ count, mobile = false }) => {
    if (!count || count === 0) return null;
    const size = mobile ? 'w-4 h-4 text-[9px] top-0 right-0' : 'w-4 h-4 text-[9px] top-1 right-1';
    return (
      <span className={`absolute ${size} bg-rose-500 text-white rounded-full flex items-center justify-center font-bold leading-none`}>
        {count > 9 ? '9+' : count}
      </span>
    );
  };

  return (
    <>
      {/* Top Navbar (Desktop Only) */}
      <nav className="glass sticky top-0 z-40 border-b border-pink-100 px-6 py-4 hidden md:flex justify-between items-center shadow-sm">
        <Link to="/" className="flex items-center gap-2 text-rose-500 font-bold text-xl">
          <Heart className="text-rose-400 fill-rose-100" />
          <span>Tabungan Bersama</span>
        </Link>
        
        <div className="flex items-center gap-8">
          <Link to="/" className={`font-medium transition-colors ${isActive('/') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}>Beranda</Link>
          <Link to="/budget" className={`font-medium transition-colors ${isActive('/budget') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}>Target</Link>
          <Link to="/history" className={`font-medium transition-colors ${isActive('/history') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}>Riwayat</Link>
          <Link to="/rekap" className={`font-medium transition-colors ${isActive('/rekap') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}>Rekap</Link>
          <Link to="/account" className={`font-medium transition-colors ${isActive('/account') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}>Akun</Link>
          
          <div className="flex items-center gap-3 ml-2 border-l border-pink-100 dark:border-slate-700 pl-4">
            <ThemeToggle />
            <Link to="/notifications" className="relative p-2 text-gray-500 dark:text-slate-400 hover:text-rose-500 transition-colors">
              <Bell size={20} />
              <BadgeCount count={unreadCount} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Top Header */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-pink-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
          <span>Tabungan Bersama</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/notifications" className="relative p-2 text-gray-500 dark:text-slate-400 hover:text-rose-500 transition-colors">
            <Bell size={20} />
            <BadgeCount count={unreadCount} mobile={true} />
          </Link>
        </div>
      </div>

      {/* Left Sidebar Menu (Mobile Only) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] md:hidden"
              onClick={closeMenu}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 z-[101] shadow-2xl flex flex-col md:hidden pb-safe"
            >
              <div className="p-6 flex justify-between items-center border-b border-pink-100 dark:border-slate-800">
                <span className="text-rose-500 font-bold text-xl">Main Menu</span>
                <button onClick={closeMenu} className="p-2 text-gray-500 bg-gray-100 dark:bg-slate-800 rounded-full hover:text-rose-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1 overflow-y-auto">
                <Link to="/" onClick={closeMenu} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isActive('/') ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'text-gray-600 dark:text-slate-400'}`}>
                  <Heart size={20} className={isActive('/') ? 'fill-rose-100' : ''} /> <span className="font-semibold">Beranda</span>
                </Link>
                <Link to="/budget" onClick={closeMenu} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isActive('/budget') ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'text-gray-600 dark:text-slate-400'}`}>
                  <Target size={20} className={isActive('/budget') ? 'fill-rose-100' : ''} /> <span className="font-semibold">Target</span>
                </Link>
                <Link to="/history" onClick={closeMenu} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isActive('/history') ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'text-gray-600 dark:text-slate-400'}`}>
                  <Activity size={20} /> <span className="font-semibold">Riwayat</span>
                </Link>
                <Link to="/rekap" onClick={closeMenu} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isActive('/rekap') ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'text-gray-600 dark:text-slate-400'}`}>
                  <PieChart size={20} className={isActive('/rekap') ? 'fill-rose-100' : ''} /> <span className="font-semibold">Rekap</span>
                </Link>
                <Link to="/account" onClick={closeMenu} className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${isActive('/account') ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' : 'text-gray-600 dark:text-slate-400'}`}>
                  <User size={20} className={isActive('/account') ? 'fill-rose-100' : ''} /> <span className="font-semibold">Akun</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
