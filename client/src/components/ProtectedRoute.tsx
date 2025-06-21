import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useAuth()

  if (!token) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
