import { createContext, useState, useRef, useCallback, useEffect, useContext } from 'react';
import api from '../services/api';
import Toast from '../components/ui/Toast';
import { AnimatePresence } from 'framer-motion';
import { requestNotificationPermission, sendNativeNotification } from '../services/nativeNotification';

export const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [localToast, setLocalToast] = useState(null);
  const pollingRef = useRef(null);
  // Track IDs of notifications we've already shown natively to avoid duplicates
  const shownNativeIds = useRef(new Set());

  // ── Fetch all notifications from API ──────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const { data } = await api.get('/api/notifications');
      setNotifications(data);

      const unread = data.filter(n => !n.read);
      setUnreadCount(unread.length);

      // Kirim native notification untuk notif baru yang belum pernah dikirim
      for (const notif of unread) {
        if (!shownNativeIds.current.has(notif._id)) {
          shownNativeIds.current.add(notif._id);
          await sendNativeNotification('TabunganBersama 🌸', notif.message);
        }
      }
    } catch {
      // Silently fail (user may not be logged in yet)
    }
  }, []);

  // ── Start / stop polling based on token presence ──────────────────────────
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // already running
    // Minta izin notifikasi saat mulai polling (sekali saja)
    requestNotificationPermission();
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 15000); // every 15s
  }, [fetchNotifications]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Auto-start polling if token exists, stop on cleanup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  // ── Local toast (for instant feedback, also goes to notif list) ──────────
  const showToast = (message, type = 'success') => {
    setLocalToast({ message, type });
    setTimeout(() => setLocalToast(null), 3000);
    setTimeout(fetchNotifications, 500);
  };

  // ── Mark all as read (call API) ───────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      //
    }
  };

  // ── Clear all notifications ───────────────────────────────────────────────
  const clearNotifications = async () => {
    try {
      await api.delete('/api/notifications');
      setNotifications([]);
      setUnreadCount(0);
      shownNativeIds.current.clear();
    } catch {
      //
    }
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      notifications,
      unreadCount,
      markAllRead,
      clearNotifications,
      fetchNotifications,
      startPolling,
      stopPolling,
    }}>
      {children}
      <AnimatePresence>
        {localToast && (
          <Toast 
            message={localToast.message} 
            type={localToast.type} 
            onClose={() => setLocalToast(null)} 
          />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};
