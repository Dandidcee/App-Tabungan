import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Urutan halaman dari kiri ke kanan (sesuai bottom nav)
const ROUTES = ['/', '/budget', '/history', '/rekap', '/account'];

// Minimum pixel untuk dianggap swipe (bukan tap/scroll)
const SWIPE_MIN_X = 60;
// Maksimum vertical movement — jika user scroll vertikal, jangan trigger swipe
const SWIPE_MAX_Y_RATIO = 1.0;

export const useSwipeNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Hanya rekam touch pertama (single finger)
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;

      // Abaikan jika terlalu vertikal (user sedang scroll)
      if (Math.abs(deltaY) > Math.abs(deltaX) * SWIPE_MAX_Y_RATIO) return;
      // Abaikan jika swipe terlalu pendek
      if (Math.abs(deltaX) < SWIPE_MIN_X) return;

      const currentIndex = ROUTES.indexOf(location.pathname);
      if (currentIndex === -1) return; // Bukan halaman utama (login, notif, dll)

      if (deltaX < 0) {
        // Swipe kiri → halaman berikutnya
        const nextIndex = Math.min(currentIndex + 1, ROUTES.length - 1);
        if (nextIndex !== currentIndex) navigate(ROUTES[nextIndex]);
      } else {
        // Swipe kanan → halaman sebelumnya
        const prevIndex = Math.max(currentIndex - 1, 0);
        if (prevIndex !== currentIndex) navigate(ROUTES[prevIndex]);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navigate, location.pathname]);
};
