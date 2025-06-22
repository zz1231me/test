import React, { useState } from 'react';
import { useAuth } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import AdminUserPage from './AdminUserPage';
import MyTUICalendar from './components/MyTUICalendar';

function Dashboard() {
  const { username, role, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('calendar');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderMainContent = () => {
    if (activeView === 'admin') return <AdminUserPage />;
    if (activeView === 'notice') return <div className="p-6 text-lg">📌 공지사항 게시판</div>;
    if (activeView === 'onboarding') return <div className="p-6 text-lg">🚀 온보딩 자료</div>;
    if (activeView === 'shared') return <div className="p-6 text-lg">📂 공유용 자료</div>;
    if (activeView === 'internal') return <div className="p-6 text-lg">🔒 시큐아이 내부업무</div>;

    return (
      <div className="p-6">
        <div className="p-4">          
          <MyTUICalendar />
          <p className="text-sm text-gray-600 mb-4 text-center">
            안녕하세요, {username}님
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex px-6 py-6 text-base">
      {/* 사이드바 */}
      <aside className="w-[170px] bg-white shadow rounded-lg p-4 flex flex-col justify-between mr-[10px]">
        <div>
          <h1 className="text-lg font-bold text-gray-800 mb-1">📊 대시보드</h1>
          <p className="text-sm text-gray-600 mb-4 text-center">
            안녕하세요, {username}님
          </p>

          <nav className="space-y-2">
            <SidebarButton label="ㅤ📅 캘린더" value="calendar" active={activeView} setActive={setActiveView} />
            <SidebarButton label="ㅤ📌 공지사항" value="notice" active={activeView} setActive={setActiveView} />
            <SidebarButton label="ㅤ🚀 온보딩" value="onboarding" active={activeView} setActive={setActiveView} />
            <SidebarButton label="ㅤ📂 공유용" value="shared" active={activeView} setActive={setActiveView} />
            <SidebarButton label="ㅤ🔒 내부업무" value="internal" active={activeView} setActive={setActiveView} />
            {role === 'admin' && (
              <SidebarButton label="ㅤ🛡️ 관리자" value="admin" active={activeView} setActive={setActiveView} />
            )}
          </nav>
          <button
          onClick={handleLogout}
          className="mt-6 bg-red-500 text-white w-full py-2 rounded hover:bg-red-600 transition"
          >
          LogOut
        </button>
        </div>

      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 bg-white rounded-lg shadow p-8 overflow-auto">
        {renderMainContent()}
      </main>
    </div>
  );
}

function SidebarButton({ label, value, active, setActive }) {
  const isActive = active === value;
  return (
    <button
      onClick={() => setActive(value)}
      className={`w-full text-left px-3 py-[10px] mb-[10px] rounded-md text-base transition 
        ${isActive ? 'bg-blue-100 text-blue-800 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
    >
      {label}
    </button>
  );
}

export default Dashboard;
