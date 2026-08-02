import axios from 'axios';

const api = axios.create({
  baseURL: '', // Uses Vite proxy or relative path
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vantage_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vantage_token');
      localStorage.removeItem('vantage_user');
    }
    return Promise.reject(error);
  }
);

export default api;
