import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';

function PasswordChangeModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const showPopup = (message: string, field?: string) => {
    setError(message);
    setSuccess('');
    setErrorField(field || null);
    setShowAlert(true);
    if (field === 'current') currentRef.current?.focus();
    else if (field === 'new') newRef.current?.focus();
    else if (field === 'confirm') confirmRef.current?.focus();
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setShowAlert(false);
    setErrorField(null);

    if (!currentPassword) return showPopup('현재 비밀번호를 입력해주세요.', 'current');
    if (!newPassword) return showPopup('새 비밀번호를 입력해주세요.', 'new');
    if (!confirmPassword) return showPopup('새 비밀번호 확인을 입력해주세요.', 'confirm');
    if (newPassword !== confirmPassword)
      return showPopup('새 비밀번호가 일치하지 않습니다.', 'confirm');

    setLoading(true);
    try {
      await axios.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorField(null);
      setSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setShowAlert(true);
    } catch (err: any) {
      showPopup(err.response?.data?.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error || success) {
      setShowAlert(true);
      const fadeOut = setTimeout(() => setShowAlert(false), 2800);
      const clearMsg = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => {
        clearTimeout(fadeOut);
        clearTimeout(clearMsg);
      };
    }
  }, [error, success]);

  const inputClass = (field: string) =>
    `flex-1 px-6 py-4 text-xl rounded-xl transition-all duration-300 font-medium
     focus:outline-none focus:ring-4 focus:shadow-lg ${
       errorField === field 
         ? 'bg-red-50 border-2 border-red-400 focus:border-red-500 focus:ring-red-200' 
         : 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 focus:border-blue-400 focus:ring-blue-200 hover:from-purple-50 hover:to-blue-50'
     } placeholder-gray-500 text-gray-800`;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-100 to-purple-100 z-50 flex items-center justify-center">
      {/* 기존 스타일의 중앙 에러/성공 메시지 */}
      {(error || success) && (
        <div
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
            bg-white font-bold text-2xl border-4 border-gray-800 px-8 py-6 rounded-2xl z-[9999] 
            min-w-[350px] text-center shadow-2xl transition-all duration-300 ${
            showAlert ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } ${success ? 'text-green-600' : 'text-red-600'}`}
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-3xl">
              {success ? '✅' : '❌'}
            </span>
            <span>{error || success}</span>
          </div>
        </div>
      )}

      {/* 기존 구성 유지한 비밀번호 변경 폼 */}
      <div className="w-full max-w-[550px] bg-white p-12 rounded-3xl shadow-2xl space-y-8 text-xl relative z-40">
        <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          비밀번호 변경
        </h2>

        <div className="space-y-6">
          {/* 현재 비밀번호 */}
          <div className="w-2/3 mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-2xl">🔑</span>
            </div>
            <input
              ref={currentRef}
              type="password"
              placeholder="현재 비밀번호"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass('current')}
              disabled={loading}
            />
          </div>

          {/* 새 비밀번호 */}
          <div className="w-2/3 mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-2xl">🆕</span>
            </div>
            <input
              ref={newRef}
              type="password"
              placeholder="새 비밀번호"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass('new')}
              disabled={loading}
            />
          </div>

          {/* 새 비밀번호 확인 */}
          <div className="w-2/3 mx-auto flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white text-2xl">✅</span>
            </div>
            <input
              ref={confirmRef}
              type="password"
              placeholder="새 비밀번호 확인"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass('confirm')}
              disabled={loading}
            />
          </div>
        </div>

        {/* 기존 버튼 스타일 유지 */}
        <div className="pt-6 w-2/3 mx-auto">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl 
              font-semibold text-xl tracking-tight shadow-lg transition-all duration-300 transform hover:scale-105 ${
              loading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-purple-600 hover:to-blue-600 hover:shadow-xl'
            }`}
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>변경 중...</span>
              </>
            ) : (
              <>
                <span className="text-2xl">💾</span>
                <span>비밀번호 변경</span>
              </>
            )}
          </button>
        </div>

        {/* 닫기 버튼 (우상단) */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors duration-200"
          disabled={loading}
        >
          <span className="text-gray-600 text-xl font-bold">✕</span>
        </button>
      </div>
    </div>
  );
}

export default PasswordChangeModal;