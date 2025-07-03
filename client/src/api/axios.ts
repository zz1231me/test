// client/src/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,  // ✅ 절대경로 -> http://localhost:4000/api
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token'); // ✅ sessionStorage에서 읽음
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
