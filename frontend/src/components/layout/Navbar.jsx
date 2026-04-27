import { useContext, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Heart, Bell, Home, Target, Clock, BarChart3, CircleUserRound } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ThemeToggle from '../ui/ThemeToggle';

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5050';
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const normalizedPath = path.replace(/\\/g, '/');
  const baseUrl = getApiUrl().replace(/\/$/, '');
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${baseUrl}${cleanPath}`;
};

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  // ── Hide-on-scroll: sembunyi saat scroll down, muncul saat scroll up ──
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      // Sembunyi jika scroll ke bawah lebih dari 10px
      if (currentY > lastScrollY.current + 10) {
        setNavVisible(false);
      }
      // Muncul jika scroll ke atas lebih dari 5px
      else if (currentY < lastScrollY.current - 5) {
        setNavVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // ── Menu items dengan icon yang lebih natural ──
  const navItems = [
    { to: '/',        label: 'Beranda', Icon: Home,             activeFill: true  },
    { to: '/budget',  label: 'Target',  Icon: Target,           activeFill: true  },
    { to: '/history', label: 'Riwayat', Icon: Clock,            activeFill: false },
    { to: '/rekap',   label: 'Rekap',   Icon: BarChart3,        activeFill: false },
    { to: '/account', label: 'Akun',    Icon: CircleUserRound,  activeFill: true  },
  ];

  return (
    <>
      {/* Top Navbar (Desktop Only) */}
      <nav className="sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 px-6 py-4 hidden md:flex justify-between items-center shadow-sm bg-white dark:bg-slate-900">
        <Link to="/" className="flex items-center gap-2 text-rose-500 font-bold text-xl">
          {user?.profilePicture && !imageError ? (
            <img 
              src={getImageUrl(user.profilePicture)} 
              alt="Profile" 
              className="w-8 h-8 rounded-full object-cover border-2 border-rose-200" 
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-500">
              <CircleUserRound size={20} />
            </div>
          )}
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
            <button onClick={() => isActive('/notifications') ? navigate(-1) : navigate('/notifications')} className={`relative p-2 transition-colors ${isActive('/notifications') ? 'text-rose-500' : 'text-gray-500 dark:text-slate-400 hover:text-rose-500'}`}>
              <Bell size={20} />
              <BadgeCount count={unreadCount} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Top Header — Solid (Gak Transparan) */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex justify-between items-center px-4 pb-3 bg-white dark:bg-slate-900 shadow-sm"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 0.6rem)',
        }}
      >
        <Link to="/" className="flex items-center gap-2 text-rose-500 font-bold text-lg">
          {user?.profilePicture && !imageError ? (
            <img 
              src={getImageUrl(user.profilePicture)} 
              alt="Profile" 
              className="w-7 h-7 rounded-full object-cover border-2 border-rose-200" 
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-500">
              <CircleUserRound size={18} />
            </div>
          )}
          <span>Tabungan Bersama</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => isActive('/notifications') ? navigate(-1) : navigate('/notifications')} className={`relative p-2 transition-colors ${isActive('/notifications') ? 'text-rose-500' : 'text-gray-500 dark:text-slate-400 hover:text-rose-500'}`}>
            <Bell size={20} />
            <BadgeCount count={unreadCount} mobile={true} />
          </button>
        </div>
      </div>

      {/* Bottom Navigation (Mobile Only) — hide-on-scroll */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-2 pt-2 transition-transform duration-300 ease-in-out bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border-t border-rose-100/50 dark:border-slate-800 shadow-[0_-4px_24px_rgba(244,63,94,0.08)] dark:shadow-none"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)',
          transform: navVisible ? 'translateY(0)' : 'translateY(110%)',
        }}
      >
        {navItems.map(({ to, label, Icon, activeFill }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all duration-200 ${
                active ? 'text-rose-500' : 'text-gray-400 dark:text-slate-500'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${active ? 'bg-rose-50 dark:bg-rose-500/20' : ''}`}>
                <Icon
                  size={22}
                  className={activeFill && active ? 'fill-rose-100 dark:fill-rose-500/30' : ''}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-semibold tracking-tight ${active ? 'text-rose-500' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

