import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useAuth();

  // 세션 만료 시간 검사
  const loginTime = parseInt(sessionStorage.getItem('loginTime') || '0', 10);
  const expireLimit = 60 * 60 * 1000 * 3; // 60분 = 3시간


  const isExpired = Date.now() - loginTime > expireLimit;

  if (!token || isExpired) {
    sessionStorage.clear(); // 자동 로그아웃 처리
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
