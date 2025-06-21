import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'

import PublicBoard from './pages/boards/PublicBoard'
import PublicBoardNew from './pages/boards/PublicBoardNew'
import SecuiBoard from './pages/boards/SecuiBoard'
import DhlBoard from './pages/boards/DhlBoard'
import Unauthorized from './pages/Unauthorized'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 */}
        <Route path="/" element={<Login />} />

        {/* 대시보드 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* 공용 게시판 */}
        <Route
          path="/board/public"
          element={
            <ProtectedRoute>
              <PublicBoard />
            </ProtectedRoute>
          }
        />

        {/* 공용 게시판 글쓰기 */}
        <Route
          path="/board/public/new"
          element={
            <ProtectedRoute>
              <PublicBoardNew />
            </ProtectedRoute>
          }
        />

        {/* SECUI 전용 게시판 */}
        <Route
          path="/board/secui"
          element={
            <RoleProtectedRoute allowedRoles={['SECUI']}>
              <SecuiBoard />
            </RoleProtectedRoute>
          }
        />

        {/* DHL 전용 게시판 */}
        <Route
          path="/board/dhl"
          element={
            <RoleProtectedRoute allowedRoles={['DHL']}>
              <DhlBoard />
            </RoleProtectedRoute>
          }
        />

        {/* 권한 없음 안내 */}
        <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
