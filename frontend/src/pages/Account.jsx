import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Camera, Save, CameraOff, LogOut, AlertTriangle, RefreshCcw, Fingerprint, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { setIndonesianValidity } from '../utils/validation';

const emojis = ['👋', '😎', '💖', '🚀', '🔥', '✨', '👑', '💸', '🤑', '⭐', '🦄', '🎉', '🌟'];

import api, { getImageUrl } from '../services/api';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

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
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef(null);

  const [isBiometricEnabled, setIsBiometricEnabled] = useState(() => localStorage.getItem('isBiometricEnabled') === 'true');

  const handleToggleBiometric = async () => {
    if (isBiometricEnabled) {
      // Matikan
      localStorage.setItem('isBiometricEnabled', 'false');
      setIsBiometricEnabled(false);
      showToast('Kunci Sidik Jari dimatikan', 'success');
      return;
    }

    // Aktifkan
    try {
      const result = await NativeBiometric.isAvailable();
      if (!result.isAvailable) {
        return showToast('Perangkat tidak mendukung Sidik Jari / Biometrik', 'error');
      }

      await NativeBiometric.verifyIdentity({
        reason: "Sentuh sensor sidik jari untuk mengaktifkan Passkey",
        title: "Aktivasi Passkey / Sidik Jari",
        subtitle: "Verifikasi identitas",
        description: "Pastikan ini adalah Anda"
      });

      localStorage.setItem('isBiometricEnabled', 'true');
      setIsBiometricEnabled(true);
      showToast('Kunci Sidik Jari berhasil diaktifkan!', 'success');
    } catch (err) {
      showToast('Gagal memverifikasi Sidik Jari', 'error');
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setEmoji(user.emoji || '👋');
      setProfilePicture(user.profilePicture || '');
      setImageError(false);
    }
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('proof', file); // Use existing upload backend

    setIsUploading(true);
    try {
      const res = await api.post('/api/upload', formData);
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

  const handleRemovePhoto = async () => {
    setIsUpdating(true);
    try {
      // Create a payload that only changes the profilePicture to empty string
      // But we must include existing name, email, emoji because the backend might expect them? 
      // Actually backend only updates provided fields.
      const payload = { profilePicture: '' };
      const res = await api.put('/api/auth/profile', payload);
      setProfilePicture('');
      updateUser(res.data);
      showToast('Foto berhasil dihapus dari server!', 'success');
    } catch (err) {
      showToast('Gagal menghapus foto', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      await api.delete('/api/settings/reset');
      showToast('Sistem barusan di-reset bersih!', 'success');
      setIsResetModalOpen(false);
      // Wait for 1s then reload to pull completely empty states
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mereset data', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-20 md:pb-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <User className="text-indigo-500 dark:text-indigo-400" /> Profil Akun
        </h1>
      </div>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-white dark:border-slate-800">
        
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-800 dark:to-slate-900 relative group">
            {profilePicture && !imageError ? (
              <img 
                src={getImageUrl(profilePicture)} 
                alt="Profile Avatar" 
                className="w-full h-full object-cover" 
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 dark:text-slate-700">
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
              onClick={handleRemovePhoto} 
              disabled={isUpdating}
              className="mt-2 text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
            >
              <CameraOff size={12} /> Hapus Foto
            </button>
          )}

          <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 font-medium text-center">Klik foto untuk mengganti avatar</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-5">
          {/* Dashboard Greeting Emoji */}
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 mb-6">
             <label className="block text-sm font-bold text-indigo-900 dark:text-indigo-400 mb-2">Emoji Sapaan Dashboard Anda</label>
             <div className="flex gap-2 text-2xl flex-wrap justify-center">
               {emojis.map(em => (
                 <button 
                  type="button" 
                  key={em} 
                  onClick={() => setEmoji(em)} 
                  className={`p-2 rounded-xl transition-all ${emoji === em ? 'bg-indigo-100 dark:bg-indigo-900/40 scale-110 shadow-sm border border-indigo-200 dark:border-indigo-800' : 'bg-transparent opacity-50 hover:opacity-100'}`}
                 >
                   {em}
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                <User size={16} className="text-gray-400 dark:text-slate-500" /> Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                onInvalid={setIndonesianValidity}
                onInput={setIndonesianValidity}
                className="w-full px-4 py-3 bg-gray-50/50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-300 dark:text-slate-100 outline-none font-semibold transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                <Mail size={16} className="text-gray-400 dark:text-slate-500" /> Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onInvalid={setIndonesianValidity}
                onInput={setIndonesianValidity}
                className="w-full px-4 py-3 bg-gray-50/50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-300 dark:text-slate-100 outline-none font-semibold transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-1">
                <Lock size={16} className="text-gray-400 dark:text-slate-500" /> Password Baru
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Biarkan kosong jika tidak ingin mengubah password"
                className="w-full px-4 py-3 bg-gray-50/50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-300 dark:text-slate-100 outline-none placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
              />
            </div>
          </div>

         <button type="submit" disabled={isUpdating} className="btn-pill btn-pill-indigo w-full mt-6 py-4 text-lg flex justify-center items-center gap-2">
             {isUpdating ? 'Menyimpan...' : <><Save size={20} /> Simpan Perubahan</>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800">
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-4 font-semibold uppercase tracking-wider text-center">Keamanan & Akses</p>
          
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-slate-700 mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isBiometricEnabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                <Fingerprint size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-slate-200">Passkey / Sidik Jari</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Kunci aplikasi saat diminimize</p>
              </div>
            </div>
            
            {/* Custom Toggle Switch */}
            <div 
              onClick={handleToggleBiometric}
              className={`w-12 h-6 flex items-center bg-gray-300 dark:bg-slate-600 rounded-full p-1 cursor-pointer transition-colors duration-300 ${isBiometricEnabled ? 'bg-emerald-500 dark:bg-emerald-500' : ''}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isBiometricEnabled ? 'translate-x-6' : ''}`}></div>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <p className="text-sm text-gray-400 dark:text-slate-500 mb-3 font-semibold uppercase tracking-wider text-center">Lainnya</p>
          <div className="flex gap-4">
             <button 
               onClick={handleLogout}
               className="btn-pill btn-pill-ghost"
             >
               <LogOut size={18} />
               Keluar
             </button>
             <button 
               onClick={() => setIsResetModalOpen(true)}
               className="btn-pill btn-pill-rose"
             >
               <AlertTriangle size={18} />
               Reset Database
             </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => !isResetting && setIsResetModalOpen(false)} title="PERINGATAN ❗">
         <div className="text-center p-2 space-y-4">
             <AlertTriangle size={60} className="mx-auto text-yellow-500 dark:text-yellow-400 animate-pulse" />
             <p className="text-sm font-semibold text-gray-700 dark:text-slate-100">Apakah anda ingin menghapus semua data</p>
             <p className="text-xs text-gray-500 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30 text-center">Aksi ini akan menghapus semua data (transaksi, riwayat, dll) yang ada di server</p>
             
             <div className="flex gap-3 mt-6">
                <Button onClick={() => setIsResetModalOpen(false)} variant="outline" className="flex-1 py-3 bg-gray-50 dark:bg-slate-800 border-0">Batal</Button>
                <Button onClick={handleResetData} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 dark:shadow-rose-900/40">
                   {isResetting ? <RefreshCcw className="animate-spin h-5 w-5 mx-auto" /> : 'Lanjutkan'}
                </Button>
             </div>
         </div>
      </Modal>
    </motion.div>
  );
};

export default Account;
