import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, Trash2, LogIn, UserPlus, Coins, ArrowUpRight, RefreshCw } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const TYPE_CONFIG = {
  deposit: {
    icon: <Coins size={20} />,
    color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-100 dark:border-emerald-800',
    label: 'Tabungan',
  },
  withdrawal: {
    icon: <AlertCircle size={20} />,
    color: 'text-rose-500 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    border: 'border-rose-100 dark:border-rose-800',
    label: 'Pinjaman',
  },
  login: {
    icon: <LogIn size={20} />,
    color: 'text-blue-400 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-100 dark:border-blue-800',
    label: 'Login',
  },
  register: {
    icon: <UserPlus size={20} />,
    color: 'text-violet-500 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    border: 'border-violet-100 dark:border-violet-800',
    label: 'Akun Baru',
  },
  activity: {
    icon: <CheckCircle2 size={20} />,
    color: 'text-pink-400 dark:text-pink-300',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
    border: 'border-pink-100 dark:border-pink-800',
    label: 'Aktivitas',
  },
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const Notifications = () => {
  const { notifications, markAllRead, clearNotifications, fetchNotifications } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-mark as read after 2s of viewing
    const timer = setTimeout(() => {
      markAllRead();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleNotifClick = (notif) => {
    if (notif.linkTo) {
      navigate(notif.linkTo);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20 md:pb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-3">
          <Bell className="text-rose-500" size={28} />
          Notifikasi
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-colors"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Bersihkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white/80 dark:bg-slate-900/80 glass rounded-3xl p-4 md:p-6 shadow-sm border border-pink-50 dark:border-slate-800/50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-slate-600">
            <Bell size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Belum ada notifikasi.</p>
            <p className="text-sm mt-1">Semua aktivitas akan muncul di sini.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-3">
              {notifications.map((notif, i) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.activity;
                const isClickable = !!notif.linkTo;

                return (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => isClickable && handleNotifClick(notif)}
                    className={`p-4 rounded-2xl flex items-start gap-4 transition-all border
                      ${notif.read
                        ? 'bg-gray-50/50 dark:bg-slate-800/20 border-gray-100 dark:border-slate-800/50'
                        : `${cfg.bg} ${cfg.border} shadow-sm`}
                      ${isClickable ? 'cursor-pointer hover:scale-[1.01] hover:shadow-md active:scale-[0.99]' : ''}
                    `}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 flex-shrink-0 p-2 rounded-xl ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm md:text-base leading-snug ${notif.read ? 'text-gray-600 dark:text-slate-400 font-medium' : 'text-gray-900 dark:text-slate-100 font-bold'}`}>
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-400">{formatTime(notif.createdAt)}</p>
                        {isClickable && (
                          <span className="text-xs text-rose-400 font-semibold flex items-center gap-0.5">
                            Lihat Riwayat <ArrowUpRight size={11} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0 animate-pulse" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};

export default Notifications;
