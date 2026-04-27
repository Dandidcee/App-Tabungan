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
import { Heart, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ROUTES = ['/', '/budget', '/history', '/rekap', '/account'];

const App = () => {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [direction, setDirection] = useState(1);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const prevIndex = ROUTES.indexOf(prevPath.current);
    const currIndex = ROUTES.indexOf(location.pathname);
    
    if (currIndex !== -1 && prevIndex !== -1 && currIndex !== prevIndex) {
      setDirection(currIndex > prevIndex ? 1 : -1);
    }
    prevPath.current = location.pathname;
  }, [location.pathname]);

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
      {/* Huge Background Hearts */}
      <Heart size={400} className="fixed -top-32 -left-32 text-rose-200/40 dark:text-rose-500/10 -z-10 rotate-12" />
      <Heart size={500} className="fixed -bottom-40 -right-40 text-pink-200/40 dark:text-pink-500/10 -z-10 -rotate-12" />
      
      <Navbar />
      <div
        className="max-w-5xl mx-auto p-4 md:p-8 md:pt-8"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 4.5rem)' }}
      >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={location.pathname}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              drag={user ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0}
              onDragEnd={(e, { offset }) => {
                const swipe = offset.x;
                const currIndex = ROUTES.indexOf(location.pathname);
                if (currIndex === -1) return;

                if (swipe < -60) {
                  const nextIndex = Math.min(currIndex + 1, ROUTES.length - 1);
                  if (nextIndex !== currIndex) navigate(ROUTES[nextIndex]);
                } else if (swipe > 60) {
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
