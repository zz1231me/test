import React from 'react'
import { useAuth } from '../store/auth'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const { email, role, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">대시보드</h1>
      <p className="mb-4">👋 안녕하세요, <strong>{email}</strong> 님! (권한: {role})</p>

      {role === 'SECUI' && (
        <div className="mb-4 bg-green-100 p-4 rounded">
          ✅ SECUI 사용자 전용 메뉴입니다!
        </div>
      )}

      {role === 'DHL' && (
        <div className="mb-4 bg-blue-100 p-4 rounded">
          📦 DHL 사용자 전용 기능입니다.
        </div>
      )}

      {role !== 'SECUI' && role !== 'DHL' && (
        <div className="mb-4 bg-yellow-100 p-4 rounded">
          🛡️ 기타 사용자 전용 콘텐츠입니다.
        </div>
      )}

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        로그아웃
      </button>
    </div>
  )
}

export default Dashboard
