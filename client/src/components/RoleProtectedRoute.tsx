import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

interface Props {
  children: JSX.Element
  allowedRoles: string[]
}

const RoleProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { token, role } = useAuth()

  if (!token) return <Navigate to="/" replace />
  if (!allowedRoles.includes(role || '')) return <Navigate to="/unauthorized" replace />

  return children
}

export default RoleProtectedRoute
