import { createContext, useState, useContext } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showToast = (message, type = 'success') => {
    const newNotif = {
      id: Date.now(),
      message,
      type,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    // Put newest notifications at the front
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  
  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ToastContext.Provider value={{ showToast, notifications, unreadCount, markAllRead, clearNotifications }}>
      {children}
      {/* No more pop-up AnimatePresence here! Everything goes to the notifications page silently. */}
    </ToastContext.Provider>
  );
};
