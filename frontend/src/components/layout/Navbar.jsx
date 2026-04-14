import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Heart, Activity, Target, LogOut, Bell } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <span>Tabungan Nikah</span>
        </Link>
        
        <div className="flex items-center gap-8">
          <Link to="/" className={`font-medium transition-colors ${isActive('/') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}>Beranda</Link>
          <Link to="/budget" className={`font-medium transition-colors ${isActive('/budget') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}>Target</Link>
          <Link to="/history" className={`font-medium transition-colors ${isActive('/history') ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}>Riwayat</Link>
          
          <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-rose-500 transition-colors ml-2">
            <Bell size={20} />
            <BadgeCount count={unreadCount} />
          </Link>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-500 hover:text-rose-500 bg-rose-50 px-4 py-2 rounded-full transition-colors ml-4"
          >
            <LogOut size={16} />
            <span className="font-medium text-sm">Keluar</span>
          </button>
        </div>
      </nav>

      {/* Mobile Top Header */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white/50 backdrop-blur-sm border-b border-pink-100">
        <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
          <Heart className="text-rose-400 fill-rose-100" size={20} />
          <span>Tabungan Nikah</span>
        </div>
        {/* Hanya tombol Keluar di header atas mobile — Notif sudah ada di bottom nav */}
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-gray-500 hover:text-rose-500 bg-white px-3 py-2 rounded-full shadow-sm border border-gray-100 text-sm font-medium">
          <LogOut size={15} />
          <span>Keluar</span>
        </button>
      </div>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden bg-white/95 backdrop-blur-xl fixed bottom-0 left-0 right-0 z-50 border-t border-pink-100 px-8 py-3 flex justify-between items-center pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-rose-500' : 'text-gray-400'}`}>
          <Heart size={24} className={isActive('/') ? 'fill-rose-100' : ''} />
          <span className="text-[10px] font-semibold">Beranda</span>
        </Link>
        <Link to="/budget" className={`flex flex-col items-center gap-1 ${isActive('/budget') ? 'text-rose-500' : 'text-gray-400'}`}>
          <Target size={24} className={isActive('/budget') ? 'fill-rose-100' : ''} />
          <span className="text-[10px] font-semibold">Target</span>
        </Link>
        <Link to="/history" className={`flex flex-col items-center gap-1 ${isActive('/history') ? 'text-rose-500' : 'text-gray-400'}`}>
          <Activity size={24} />
          <span className="text-[10px] font-semibold">Riwayat</span>
        </Link>
        <Link to="/notifications" className={`relative flex flex-col items-center gap-1 ${isActive('/notifications') ? 'text-rose-500' : 'text-gray-400'}`}>
          <div className="relative">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-[9px] leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold">Notif</span>
        </Link>
      </nav>
    </>
  );
};
