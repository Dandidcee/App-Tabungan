import axios from 'axios';

const BASE_URL = 'http://144.91.93.11:5050';

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

export const getApiUrl = () => BASE_URL;
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const normalizedPath = path.replace(/\\/g, '/');
  const baseUrl = getApiUrl().replace(/\/$/, '');
  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  return `${baseUrl}${cleanPath}`;
};

export default api;
