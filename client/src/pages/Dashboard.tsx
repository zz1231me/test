// client/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../store/auth';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { fetchUserAccessibleBoards } from '../api/boards'; // ✅ 서버 API 사용
import { getBookmarks, type Bookmark } from '../utils/bookmarks';

// ✅ 서버 API 응답에 맞는 인터페이스로 변경
interface AccessibleBoard {
 id: string;           // boardId → id
 name: string;         // boardName → name  
 description?: string; // 추가
 order: number;        // 추가 (핵심!)
 permissions: {        // 구조 변경
   canRead: boolean;
   canWrite: boolean;
   canDelete: boolean;
 };
}

function Dashboard() {
 const { name, role, logout } = useAuth();
 const navigate = useNavigate();
 const location = useLocation();
 const [sidebarOpen, setSidebarOpen] = useState(true);
 const [accessibleBoards, setAccessibleBoards] = useState<AccessibleBoard[]>([]);
 const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
 const [boardsLoading, setBoardsLoading] = useState(false); // ✅ 로딩 상태 추가

 const handleLogout = () => {
   logout();
   navigate('/');
 };

 useEffect(() => {
   if (location.pathname === '/dashboard') {
     navigate('/dashboard/calendar', { replace: true });
   }
 }, [location.pathname, navigate]);

 useEffect(() => {
   let timeoutId: NodeJS.Timeout;
   const handleActivity = () => {
     clearTimeout(timeoutId);
     timeoutId = setTimeout(() => {
       sessionStorage.setItem('loginTime', Date.now().toString());
     }, 5000);
   };

   window.addEventListener('mousemove', handleActivity);
   window.addEventListener('keydown', handleActivity);
   window.addEventListener('click', handleActivity);

   return () => {
     window.removeEventListener('mousemove', handleActivity);
     window.removeEventListener('keydown', handleActivity);
     window.removeEventListener('click', handleActivity);
     clearTimeout(timeoutId);
   };
 }, []);

 // ✅ JWT 대신 서버 API 사용하여 게시판 목록 가져오기 (순서 포함)
 useEffect(() => {
   if (!role) return;

   const loadAccessibleBoards = async () => {
     setBoardsLoading(true);
     try {
       console.log('🔐 서버에서 접근 가능한 게시판 목록 로딩 중...');
       
       const response = await fetchUserAccessibleBoards();
       const boards = response.data;
       
       console.log('✅ 서버 응답 게시판 목록 (order 순 정렬됨):', boards);
       
       setAccessibleBoards(boards);
     } catch (error) {
       console.error('❌ 게시판 목록 로딩 실패:', error);
       setAccessibleBoards([]);
     } finally {
       setBoardsLoading(false);
     }
   };

   loadAccessibleBoards();
 }, [role]);

 // 북마크 로딩
 useEffect(() => {
   try {
     console.log('📖 북마크 정보 로딩 중...');
     
     const bookmarkData = getBookmarks();
     console.log('✅ 북마크 정보:', bookmarkData);
     
     setBookmarks(bookmarkData);
   } catch (error) {
     console.error('❌ 북마크 로딩 실패:', error);
     setBookmarks([]);
   }
 }, []);

 const openBookmark = (url: string) => {
   let finalUrl = url;
   if (!url.startsWith('http://') && !url.startsWith('https://')) {
     finalUrl = `https://${url}`;
   }
   window.open(finalUrl, '_blank', 'noopener,noreferrer');
 };

 // 게시판별 아이콘 매핑
 const getBoardIcon = (boardId: string) => {
   const iconMap: Record<string, JSX.Element> = {
     notice: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
       </svg>
     ),
     general: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
       </svg>
     ),
     admin: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
       </svg>
     ),
     onboarding: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
       </svg>
     ),
     shared: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
       </svg>
     ),
     internal: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
       </svg>
     ),
     free: (
       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
       </svg>
     ),
   };

   return iconMap[boardId] || (
     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
     </svg>
   );
 };

 return (
   <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
     {/* Top Header */}
     <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 flex items-center px-2 sm:px-4 shadow-sm z-30 overflow-hidden">
       <div className="w-full flex items-center justify-between gap-2 sm:gap-4 max-w-full">
         {/* 왼쪽 영역 */}
         <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
           <button
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 lg:hidden flex-shrink-0"
             aria-label="Toggle sidebar"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
             </svg>
           </button>
           
           <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
             <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
               <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
               </svg>
             </div>
             <div className="min-w-0 overflow-hidden hidden sm:block">
               <h1 className="text-sm sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">Workspace</h1>
               <p className="text-xs text-gray-500 font-medium hidden lg:block truncate">사내 업무 시스템</p>
             </div>
           </div>
         </div>
         
         {/* 오른쪽 사용자 정보 */}
         {name && role && (
           <div className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0">
             <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
               <span className="text-white text-xs font-bold">{name.charAt(0)}</span>
             </div>
             <div className="text-sm min-w-0 overflow-hidden hidden sm:flex items-center gap-1.5">
               <span className="font-semibold text-gray-900 truncate">{name}</span>
               <span className="text-gray-400">·</span>
               <span className={`text-xs font-medium px-2 py-0.5 rounded-md truncate ${
                 role === 'admin' 
                   ? 'bg-red-100 text-red-700' 
                   : role === 'manager'
                   ? 'bg-blue-100 text-blue-700'
                   : role === 'editor'
                   ? 'bg-green-100 text-green-700'
                   : 'bg-gray-100 text-gray-700'
               }`}>
                 {role}
               </span>
             </div>
           </div>
         )}
       </div>
     </header>

     <div className="flex flex-1 overflow-hidden relative">
       {/* Sidebar */}
       <aside className={`${
         sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
       } fixed lg:relative lg:translate-x-0 left-0 top-16 lg:top-0 h-[calc(100vh-4rem)] lg:h-full w-72 transition-transform duration-300 ease-out bg-white/80 backdrop-blur-lg border-r border-gray-200/50 overflow-hidden flex-shrink-0 shadow-sm z-40 lg:z-auto`}>
         <div className="h-full overflow-y-auto">
           <div className="p-6">
             <nav className="space-y-8">
               {/* Main Section */}
               <div>
                 <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                   <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                   메인
                 </h3>
                 <div className="space-y-1">
                   <SidebarNav 
                     label="대시보드" 
                     to="calendar" 
                     icon={
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                       </svg>
                     } 
                     closeSidebar={() => setSidebarOpen(false)}
                   />
                 </div>
               </div>

               {/* 동적 게시판 섹션 */}
               <div>
                 <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                   <div className="w-1 h-4 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                   게시판
                 </h3>
                 <div className="space-y-1">
                   {boardsLoading ? (
                     <div className="px-4 py-3 text-sm text-gray-500 text-center">
                       로딩 중...
                     </div>
                   ) : accessibleBoards.length === 0 ? (
                     <div className="px-4 py-3 text-sm text-gray-500 text-center">
                       접근 가능한 게시판이 없습니다
                     </div>
                   ) : (
                     // ✅ 서버에서 이미 order 순으로 정렬되어 옴
                     accessibleBoards.map((board) => (
                       <SidebarNav 
                         key={board.id}          // ✅ boardId → id
                         label={board.name}      // ✅ boardName → name
                         to={`posts/${board.id}`} // ✅ boardId → id
                         icon={getBoardIcon(board.id)}
                         closeSidebar={() => setSidebarOpen(false)}
                       />
                     ))
                   )}
                 </div>
               </div>

               {/* 북마크 섹션 */}
               <div>
                 <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                   <div className="w-1 h-4 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full"></div>
                   북마크
                 </h3>
                 
                 <div className="space-y-1">
                   {/* 북마크 목록 */}
                   {bookmarks.length === 0 ? (
                     <div className="px-4 py-3 text-sm text-gray-500 text-center">
                       저장된 북마크가 없습니다
                     </div>
                   ) : (
                     bookmarks.slice(0, 8).map((bookmark) => (
                       <div key={bookmark.id} className="group relative">
                         <button
                           onClick={() => openBookmark(bookmark.url)}
                           className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 rounded-xl transition-all duration-200 border border-transparent hover:border-gray-200/50 hover:shadow-sm"
                         >
                           {bookmark.icon ? (
                             <img 
                               src={bookmark.icon} 
                               alt="" 
                               className="w-4 h-4 flex-shrink-0"
                               onError={(e) => {
                                 e.currentTarget.style.display = 'none';
                               }}
                             />
                           ) : (
                             <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                             </svg>
                           )}
                           <span className="truncate">{bookmark.name}</span>
                           <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                           </svg>
                         </button>
                       </div>
                     ))
                   )}
                 </div>
               </div>

               {/* Settings Section */}
               <div>
                 <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 px-2 flex items-center gap-2">
                   <div className="w-1 h-4 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
                   설정
                 </h3>
                 <div className="space-y-1">
                   {role === 'admin' && (
                     <SidebarNav 
                       label="관리자 패널" 
                       to="admin" 
                       icon={
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                       }
                       closeSidebar={() => setSidebarOpen(false)}
                     />
                   )}
                   <SidebarNav 
                     label="계정 설정" 
                     to="change-password" 
                     icon={
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                       </svg>
                     }
                     closeSidebar={() => setSidebarOpen(false)}
                   />
                 </div>
               </div>
             </nav>

             {/* Logout Button */}
             <div className="mt-8 pt-6 border-t border-gray-200/70">
               <button
                 onClick={handleLogout}
                 className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50/80 hover:text-red-700 rounded-xl transition-all duration-200 border border-red-200/50 hover:border-red-300 hover:shadow-sm"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                 로그아웃
               </button>
             </div>
           </div>
         </div>
       </aside>

       {/* Main Content */}
       <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50/50 to-white lg:ml-0">
         <div className="h-full p-4 sm:p-6">
           <Outlet />
         </div>
       </main>
     </div>

     {/* Mobile Sidebar Overlay */}
     {sidebarOpen && (
       <div 
         className="fixed inset-0 bg-black/30 z-30 lg:hidden backdrop-blur-sm" 
         onClick={() => setSidebarOpen(false)} 
       />
     )}
   </div>
 );
}

function SidebarNav({ label, to, icon, closeSidebar }: { 
 label: string; 
 to: string; 
 icon: React.ReactNode;
 closeSidebar: () => void;
}) {
 const navigate = useNavigate();
 const location = useLocation();
 // isActive 조건을 더 정확하게 변경 - 정확한 경로 매칭
 const isActive = location.pathname === `/dashboard/${to}`;

 const handleClick = () => {
   navigate(`/dashboard/${to}`);
   // 모바일에서 네비게이션 후 사이드바 닫기
   if (window.innerWidth < 1024) {
     closeSidebar();
   }
 };

 return (
   <button
     onClick={handleClick}
     className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all duration-200 text-left group relative overflow-hidden ${
       isActive
         ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/50 shadow-sm hover:shadow-md'
         : 'text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 border border-transparent hover:border-gray-200/50 hover:shadow-sm'
     }`}
   >
     {/* Active indicator */}
     {isActive && (
       <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full"></div>
     )}
     
     <span className={`transition-all duration-200 ${
       isActive ? 'text-blue-600 scale-110' : 'text-gray-500 group-hover:text-gray-700 group-hover:scale-105'
     }`}>
       {icon}
     </span>
     <span className="font-semibold">{label}</span>
     
     {/* Active dot */}
     {isActive && (
       <div className="ml-auto flex items-center">
         <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
       </div>
     )}
     
     {/* Hover glow effect */}
     <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${
       isActive 
         ? 'bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-100' 
         : 'bg-gray-500/5 opacity-0 group-hover:opacity-100'
     }`}></div>
   </button>
 );
}

export default Dashboard;