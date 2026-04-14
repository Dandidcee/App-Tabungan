import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingRef = useRef(null);

  // ── Fetch all notifications from API ──────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const { data } = await api.get('/api/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch {
      // Silently fail (user may not be logged in yet)
    }
  }, []);

  // ── Start / stop polling based on token presence ──────────────────────────
  const startPolling = useCallback(() => {
    if (pollingRef.current) return; // already running
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
    // Just trigger a refresh so real DB notification shows up immediately
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
    </ToastContext.Provider>
  );
};
