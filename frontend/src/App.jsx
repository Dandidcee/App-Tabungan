import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Budget from './pages/Budget';

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-rose-400">Loading...</div>;

  return (
    <div className="min-h-screen font-sans pb-16 md:pb-0">
      <Navbar />
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
          <Route path="/budget" element={user ? <Budget /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
