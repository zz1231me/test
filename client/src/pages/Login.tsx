// src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 로그인 세션 확인 및 자동 로그인 또는 세션 초기화
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const id = sessionStorage.getItem('id');
    const name = sessionStorage.getItem('name');
    const role = sessionStorage.getItem('role');

    if (token && id && name && role) {
      login(token, id, name, role);
      navigate('/dashboard');
    } else {
      sessionStorage.clear();
    }
  }, [login, navigate]);

  // 에러 메시지 자동 제거
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      const data = await res.json();

      // 세션 저장
      const now = Date.now();
      sessionStorage.setItem('loginTime', now.toString());
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('id', data.user.id);
      sessionStorage.setItem('name', data.user.name);
      sessionStorage.setItem('role', data.user.role);

      login(data.token, data.user.id, data.user.name, data.user.role);
      navigate('/dashboard');
    } catch (err: any) {
      sessionStorage.clear();
      // 보안을 위해 구체적인 에러 대신 일반적인 메시지 표시
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
      </div>

      <div className="relative w-full max-w-sm">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* 로그인 카드 */}
        <div className="bg-white rounded-xl shadow-lg border border-white/50 overflow-hidden">
          <div className="px-6 py-6">
            {/* 헤더 */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome Back</h1>
              <p className="text-sm text-gray-600">사내 업무 시스템에 로그인하세요</p>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 아이디 입력 */}
              <div>
                <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                  아이디
                </label>
                <input
                  id="id"
                  type="text"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={isLoading}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                           focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                           disabled:bg-gray-50 disabled:cursor-not-allowed
                           transition-colors box-border"
                  placeholder="아이디를 입력하세요"
                />
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm
                             focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
                             disabled:bg-gray-50 disabled:cursor-not-allowed
                             transition-colors box-border"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-md
                         hover:from-blue-700 hover:to-purple-700 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                         disabled:opacity-50 disabled:cursor-not-allowed
                         font-medium text-sm transition-all duration-200 box-border
                         flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </form>
          </div>

          {/* 하단 안내 */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-center text-xs text-gray-500">
              🔒 보안을 위해 개인정보를 안전하게 보관하세요
            </p>
          </div>
        </div>

        {/* 저작권 */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            © 2025 Company Workspace. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;