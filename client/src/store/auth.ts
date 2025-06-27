import { create } from 'zustand'

interface AuthState {
  token: string | null
  username: string | null
  name: string | null
  role: string | null
  login: (token: string, username: string, name: string, role: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  token: sessionStorage.getItem('token'),
  username: sessionStorage.getItem('username'),
  name: sessionStorage.getItem('name'),
  role: sessionStorage.getItem('role'),

  login: (token, username, name, role) => {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('username', username)
    sessionStorage.setItem('name', name)
    sessionStorage.setItem('role', role)
    set({ token, username, name, role })
  },

  logout: () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('name')
    sessionStorage.removeItem('role')
    set({ token: null, username: null, name: null, role: null })
  }
}))
