import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
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

const App = () => {
  const { user, loading } = useContext(AuthContext);

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
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
          <Route path="/budget" element={user ? <Budget /> : <Navigate to="/login" />} />
          <Route path="/rekap" element={user ? <Recap /> : <Navigate to="/login" />} />
          <Route path="/account" element={user ? <Account /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
