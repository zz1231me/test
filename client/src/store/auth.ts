import { create } from 'zustand'

interface AuthState {
  token: string | null
  email: string | null
  role: string | null
  login: (token: string, email: string, role: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  email: null,
  role: null,
  login: (token, email, role) => {
    localStorage.setItem('token', token)
    set({ token, email, role })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, email: null, role: null })
  }
}))
