import axios from 'axios';

const BASE_URL = 'http://144.91.93.11';

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
    if (error.response?.status === 401) {
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
