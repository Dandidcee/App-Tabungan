import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Flower2, LogOut } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-white/70 backdrop-blur-md sticky top-0 z-30 border-b border-pink-100 px-6 py-4 flex justify-between items-center shadow-sm">
      <Link to="/" className="flex items-center gap-2 text-rose-500 font-bold text-xl">
        <Flower2 className="text-rose-400" />
        <span>TabungBersama</span>
      </Link>
      
      <div className="flex items-center gap-6">
        <Link to="/" className="text-gray-600 hover:text-rose-500 font-medium transition-colors">Dashboard</Link>
        <Link to="/budget" className="text-gray-600 hover:text-rose-500 font-medium transition-colors">Budget</Link>
        <Link to="/history" className="text-gray-600 hover:text-rose-500 font-medium transition-colors">History</Link>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-rose-500 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-medium">Keluar</span>
        </button>
      </div>
    </nav>
  );
};
