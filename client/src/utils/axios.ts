// src/utils/axios.ts
import axios from 'axios'
import { useAuth } from '../store/auth'

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
})

// ✅ 응답 인터셉터: 토큰 만료되면 자동 로그아웃
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuth.getState()
      logout()
      window.location.href = '/' // 로그인 페이지로 리다이렉트
    }
    return Promise.reject(error)
  }
)

export default api
