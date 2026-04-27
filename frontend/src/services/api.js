import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto logout ketika server mengembalikan 401 (user dihapus / token tidak valid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Abaikan auto-logout jika error 401 berasal dari login/register (salah password)
    const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') || error.config?.url?.includes('/api/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Hapus semua data sesi lokal
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect ke halaman login
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
