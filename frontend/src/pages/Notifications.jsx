import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Notifications = () => {
  const { notifications, markAllRead, clearNotifications } = useToast();

  useEffect(() => {
    // Mark as read when opening the page after 1.5 seconds
    const timer = setTimeout(() => {
      markAllRead();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Bell className="text-rose-500" size={28} /> Notifikasi
        </h1>
        {notifications.length > 0 && (
          <button 
            onClick={clearNotifications}
            className="text-xs font-semibold text-gray-500 hover:text-rose-500 flex items-center gap-1 bg-white px-3 py-2 rounded-xl shadow-sm border border-gray-100 transition-colors"
          >
            <Trash2 size={14} /> Bersihkan
          </button>
        )}
      </div>

      <div className="bg-white/80 glass rounded-3xl p-4 md:p-6 shadow-sm border border-pink-50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Bell size={48} className="mb-4 opacity-20" />
            <p>Belum ada notifikasi baru.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`p-4 rounded-2xl flex items-start gap-4 transition-all ${
                  notif.read ? 'bg-gray-50/50' : 'bg-rose-50 border border-rose-100 shadow-sm'
                }`}
              >
                <div className={`mt-0.5 ${notif.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {notif.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <div className="flex-1">
                  <p className={`text-sm md:text-base ${notif.read ? 'text-gray-700 font-medium' : 'text-gray-900 font-bold'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                </div>
                {!notif.read && <div className="w-2 h-2 rounded-full bg-rose-500 mt-2"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Notifications;
