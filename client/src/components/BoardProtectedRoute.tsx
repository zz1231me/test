// client/src/components/BoardProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../store/auth';

interface Props {
  children: JSX.Element;
  action?: 'read' | 'write' | 'delete';
}

interface BoardAccessRole {
  roleId: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
}

interface BoardAccessResponse {
  boardType: string;
  roles: BoardAccessRole[];
}

const BoardProtectedRoute = ({ children, action = 'read' }: Props) => {
  const { token, role } = useAuth();
  const { boardType } = useParams<{ boardType: string }>();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null); // null = 로딩중
  const [debugInfo, setDebugInfo] = useState<string>('');

  // 토큰 없으면 로그인 페이지로
  if (!token) {
    console.log('🔍 토큰 없음 - 로그인 페이지로 이동');
    return <Navigate to="/" replace />;
  }

  // 게시판 타입 없으면 대시보드로
  if (!boardType) {
    console.log('🔍 boardType 없음 - 대시보드로 이동');
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    const fetchBoardAccess = async () => {
      try {
        console.log(`🔍 권한 체크 시작: boardType=${boardType}, action=${action}, role=${role}`);
        
        const res = await fetch(`/api/boards/access/${boardType}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        console.log(`🔍 API 응답 상태: ${res.status}`);
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`❌ API 에러: ${res.status} - ${errorText}`);
          throw new Error(`권한 요청 실패: ${res.status}`);
        }
        
        const data: BoardAccessResponse = await res.json();
        console.log('🔍 API 응답 데이터:', JSON.stringify(data, null, 2));

        // 내 역할 찾기
        const myRole = data.roles.find((r) => r.roleId === role);
        console.log(`🔍 내 역할 검색: ${role} -> ${myRole ? '찾음' : '못찾음'}`);
        
        if (!myRole) {
          console.warn(`❌ 내 역할(${role})에 대한 권한 없음`);
          console.log('🔍 사용 가능한 역할들:', data.roles.map(r => r.roleId));
          setDebugInfo(`역할 '${role}'을 찾을 수 없습니다. 사용 가능한 역할: ${data.roles.map(r => r.roleId).join(', ')}`);
          setIsAllowed(false);
          return;
        }

        console.log(`🔍 내 역할 권한:`, {
          canRead: myRole.canRead,
          canWrite: myRole.canWrite,
          canDelete: myRole.canDelete
        });

        const permissionMap = {
          read: myRole.canRead,
          write: myRole.canWrite,
          delete: myRole.canDelete,
        };

        const result = permissionMap[action];
        console.log(`🔐 최종 권한 체크: ${boardType} / ${action} = ${result}`);
        
        setDebugInfo(`게시판: ${boardType}, 액션: ${action}, 권한: ${result ? '허용' : '거부'}`);
        setIsAllowed(result);
        
      } catch (err) {
        console.error('❌ 게시판 권한 확인 실패:', err);
        setDebugInfo(`에러 발생: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
        setIsAllowed(false);
      }
    };

    fetchBoardAccess();
  }, [boardType, action, role, token]);

  // 접근 불가
  if (isAllowed === false) {
    console.log(`❌ 접근 거부됨: ${debugInfo}`);
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h2>
        <p className="text-gray-600 mb-4">{debugInfo}</p>
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  // 접근 허용
  if (isAllowed === true) {
    console.log(`✅ 접근 허용됨: ${debugInfo}`);
    return children;
  }

  // 로딩 중
  return (
    <div className="text-center p-6 text-gray-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <p>권한 확인 중...</p>
      {debugInfo && <p className="text-sm text-gray-400 mt-2">{debugInfo}</p>}
    </div>
  );
};

export default BoardProtectedRoute;