// src/App.tsx
// Toast UI + Prism CSS 전역 import (⚠️ 순서 중요)
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import '@toast-ui/editor-plugin-table-merged-cell/dist/toastui-editor-plugin-table-merged-cell.css';
import 'prismjs/themes/prism.css';


import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './pages/Unauthorized';
import PostList from './pages/boards/PostList';
import PostDetail from './pages/boards/PostDetail';
import PostEditor from './pages/boards/PostEditor';
import MyTUICalendar from './pages/components/MyTUICalendar';
import AdminUserPage from './pages/AdminUserPage';
import ChangePasswordPage from './pages/ChangePasswordPage'; // 새로 만든 컴포넌트

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/" element={<Login />} />
        {/* 권한 없음 안내 페이지 */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        {/* 보호된 경로: 대시보드 및 게시판 */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* 주요 화면 라우팅 */}
          <Route path="calendar" element={<MyTUICalendar />} />
          <Route path="admin" element={<AdminUserPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} /> {/* 수정됨 */}
          {/* 게시글 관련 */}
          <Route path="posts/:boardType/new" element={<PostEditor mode="create" />} />
          <Route path="posts/:boardType/edit/:id" element={<PostEditor mode="edit" />} />
          <Route path="posts/:boardType/:id" element={<PostDetail />} />
          <Route path="posts/:boardType" element={<PostList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;