import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Budget from './pages/Budget';
import Account from './pages/Account';
import Recap from './pages/Recap';
import Notifications from './pages/Notifications';
import { Heart, Loader2, Fingerprint } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { App as CapacitorApp } from '@capacitor/app';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

const ROUTES = ['/', '/budget', '/history', '/rekap', '/account'];

const App = () => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [direction, setDirection] = useState(1);
  const prevPath = useRef(location.pathname);
  const directionRef = useRef(1);

  const [isLocked, setIsLocked] = useState(false);
  const isVerifying = useRef(false); // Guard: prevent multiple concurrent biometric dialogs

  // --- Biometric Authentication Logic ---
  const checkBiometric = async () => {
    const biometricEnabled = localStorage.getItem('isBiometricEnabled') === 'true';
    if (!biometricEnabled) {
      setIsLocked(false);
      return;
    }

    // If already verifying, don't open a second dialog
    if (isVerifying.current) return;

    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        setIsLocked(false);
        return;
      }

      isVerifying.current = true; // Set guard BEFORE showing dialog
      await NativeBiometric.verifyIdentity({
        reason: "Silakan verifikasi sidik jari untuk membuka aplikasi",
        title: "Buka Tabungan Bersama",
        subtitle: "Gunakan Sidik Jari / Passkey Anda",
        description: "Akses tabungan Anda dengan aman"
      });
      // Success: unlock
      setIsLocked(false);
    } catch (error) {
      // Failed or cancelled: stays locked, but allow retry
      console.error("Biometric verification failed", error);
    } finally {
      isVerifying.current = false; // Always release the guard
    }
  };

  useEffect(() => {
    if (!user) return;

    // Check biometric on initial load if enabled
    const biometricEnabled = localStorage.getItem('isBiometricEnabled') === 'true';
    if (biometricEnabled) {
      setIsLocked(true);
      checkBiometric();
    }

    // Listen to app state changes (background/foreground)
    const listenerPromise = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      const enabled = localStorage.getItem('isBiometricEnabled') === 'true';
      if (!enabled) return;

      if (!isActive) {
        // App going to background: lock, but don't trigger verify yet
        // Only lock if not currently mid-verification (otherwise we'd interrupt it)
        if (!isVerifying.current) {
          setIsLocked(true);
        }
      } else {
        // App coming to foreground: trigger verify only if locked
        setIsLocked(prev => {
          if (prev) {
            // Delayed slightly to let the app fully foreground before showing dialog
            setTimeout(() => checkBiometric(), 300);
          }
          return prev;
        });
      }
    });

    return () => {
      listenerPromise.then(l => l.remove());
    };
  }, [user]);

  // Calculate direction synchronously during render to avoid 1-frame lag
  if (prevPath.current !== location.pathname) {
    const prevIndex = ROUTES.indexOf(prevPath.current);
    const currIndex = ROUTES.indexOf(location.pathname);
    if (currIndex !== -1 && prevIndex !== -1 && currIndex !== prevIndex) {
      directionRef.current = currIndex > prevIndex ? 1 : -1;
    }
    prevPath.current = location.pathname;
  }
  
  const currentDirection = directionRef.current;

  const slideVariants = {
    initial: (dir) => ({ x: dir * 30, opacity: 0 }),
    animate: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir * -30, opacity: 0 })
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors">
        <Loader2 size={48} className="text-pink-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-700 dark:text-slate-200">Tabungan Bersama</h2>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans pb-16 md:pb-0 relative overflow-x-hidden text-gray-800 dark:text-dark-text transition-colors duration-300">
      
      {/* Biometric Lock Screen Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-6"
          >
            <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Fingerprint size={50} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-2">Aplikasi Terkunci</h2>
            <p className="text-gray-500 dark:text-slate-400 text-center mb-8">
              Buka kunci dengan Sidik Jari atau Passkey untuk melanjutkan.
            </p>
            <button 
              onClick={checkBiometric}
              className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center gap-3"
            >
              <Fingerprint size={24} /> Sentuh Sensor
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Huge Background Hearts */}
      <Heart size={400} className="fixed -top-32 -left-32 text-rose-200/40 dark:text-rose-500/10 -z-10 rotate-12" />
      <Heart size={500} className="fixed -bottom-40 -right-40 text-pink-200/40 dark:text-pink-500/10 -z-10 -rotate-12" />
      
      <Navbar />
      <div
        className="max-w-5xl mx-auto p-4 md:p-8 md:pt-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4.5rem)' }}
      >
          <AnimatePresence mode="popLayout" custom={currentDirection}>
            <motion.div
              key={location.pathname}
              custom={currentDirection}
              variants={{
                initial: (dir) => ({ x: dir === 1 ? '100%' : '-100%', opacity: 1 }),
                animate: { x: 0, opacity: 1 },
                exit: (dir) => ({ x: dir === 1 ? '-100%' : '100%', opacity: 1 })
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
              drag={user ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              dragDirectionLock={true}
              onDragEnd={(e, { offset, velocity }) => {
                const swipe = offset.x;
                const swipeVelocity = velocity.x;
                const currIndex = ROUTES.indexOf(location.pathname);
                if (currIndex === -1) return;

                if (swipe < -80 || swipeVelocity < -500) {
                  const nextIndex = Math.min(currIndex + 1, ROUTES.length - 1);
                  if (nextIndex !== currIndex) navigate(ROUTES[nextIndex]);
                } else if (swipe > 80 || swipeVelocity > 500) {
                  const prevIndex = Math.max(currIndex - 1, 0);
                  if (prevIndex !== currIndex) navigate(ROUTES[prevIndex]);
                }
              }}
            >
              <Routes location={location}>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/budget" element={user ? <Budget /> : <Navigate to="/login" />} />
                <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
                <Route path="/rekap" element={user ? <Recap /> : <Navigate to="/login" />} />
                <Route path="/account" element={user ? <Account /> : <Navigate to="/login" />} />
                <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
