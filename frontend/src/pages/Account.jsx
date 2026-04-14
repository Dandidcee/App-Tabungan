import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Save, CameraOff, LogOut } from 'lucide-react';
import { Button } from '../components/ui/Button';

const emojis = ['👋', '😎', '💖', '🚀', '🔥', '✨', '👑', '💸', '🤑', '⭐', '🦄', '🎉', '🌟'];

const getApiUrl = () => import.meta.env.VITE_API_URL || 'http://localhost:5050';
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${getApiUrl()}${path}`;
};

const Account = () => {
  const { user, updateUser, logout } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emoji, setEmoji] = useState('👋');
  const [profilePicture, setProfilePicture] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setEmoji(user.emoji || '👋');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('proof', file); // Use existing upload backend

    setIsUploading(true);
    try {
      const res = await api.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfilePicture(res.data.filePath);
      showToast('Foto profil diunggah sementara. Jangan lupa simpan perubahan!', 'success');
    } catch (err) {
      showToast('Gagal mengunggah foto', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const payload = { name, email, emoji, profilePicture };
      if (password) {
        payload.password = password;
      }
      
      const res = await api.put('/api/auth/profile', payload);
      
      updateUser(res.data);
      showToast('Profil berhasil diperbarui!', 'success');
      setPassword(''); // Clear password field after successfully updating
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
          <User className="text-indigo-500" /> Profil Akun
        </h1>
      </div>

      <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-white">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 relative group">
            {profilePicture ? (
              <img src={getImageUrl(profilePicture)} alt="Profile Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                <User size={40} />
              </div>
            )}
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
            >
               {isUploading ? <span className="animate-pulse font-semibold">...</span> : <Camera size={24} />}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>
          
          {profilePicture && (
            <button 
              type="button" 
              onClick={() => setProfilePicture('')} 
              className="mt-2 text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
            >
              <CameraOff size={12} /> Hapus Foto
            </button>
          )}

          <p className="mt-3 text-sm text-gray-500 font-medium">Klik foto untuk mengganti avatar</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Dashboard Greeting Emoji */}
          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-6">
             <label className="block text-sm font-bold text-indigo-900 mb-2">Emoji Sapaan Dashboard Anda</label>
             <div className="flex gap-2 text-2xl flex-wrap justify-center">
               {emojis.map(em => (
                 <button 
                  type="button" 
                  key={em} 
                  onClick={() => setEmoji(em)} 
                  className={`p-2 rounded-xl transition-all ${emoji === em ? 'bg-indigo-100 scale-110 shadow-sm border border-indigo-200' : 'bg-transparent opacity-50 hover:opacity-100'}`}
                 >
                   {em}
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-1">
                <User size={16} className="text-gray-400" /> Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none text-gray-800 font-semibold"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-1">
                <Mail size={16} className="text-gray-400" /> Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none text-gray-800 font-semibold"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-1">
                <Lock size={16} className="text-gray-400" /> Password Baru
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Biarkan kosong jika tidak ingin mengubah password"
                className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none text-gray-800 placeholder-gray-400"
              />
            </div>
          </div>

          <Button type="submit" disabled={isUpdating} className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-700 shadow-md flex justify-center items-center gap-2 font-bold text-lg rounded-xl">
             {isUpdating ? 'Menyimpan...' : <><Save size={20} /> Simpan Perubahan</>}
          </Button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col items-center">
          <p className="text-sm text-gray-400 mb-3">Logout dari akun?</p>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-rose-500 hover:text-white hover:bg-rose-500 bg-rose-50 px-6 py-3 rounded-xl transition-all font-bold shadow-sm"
          >
            <LogOut size={18} />
            Keluar dari Akun
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Account;
