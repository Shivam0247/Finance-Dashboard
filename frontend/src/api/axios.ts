import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const session = localStorage.getItem('finance_session');
  if (session) {
    const { token } = JSON.parse(session);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('finance_session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
