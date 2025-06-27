import React, { useEffect, useState } from 'react';
import api from '../api/axios';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'group1' | 'group2';
}

const roles = ['admin', 'group1', 'group2'];
const boardTypes = ['notice', 'onboarding', 'shared', 'internal', 'free'];

const AdminUserPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({ id: '', password: '', name: '', role: 'group1' });
  const [accessMap, setAccessMap] = useState<Record<string, string[]>>({});
  const token = sessionStorage.getItem('token');

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchAccessSettings();
    }
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error('사용자 목록 오류:', err);
      alert('사용자 목록을 불러오지 못했습니다.');
    }
  };

  // ✅ 게시판 접근 권한 불러오기
  const fetchAccessSettings = async () => {
    try {
      const accessState: Record<string, string[]> = {};
      for (const boardType of boardTypes) {
        const res = await api.get(`/boards/access/${boardType}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        accessState[boardType] = res.data.roles;
      }
      setAccessMap(accessState);
    } catch (err) {
      console.error('접근 권한 불러오기 실패:', err);
      alert('접근 권한을 불러오지 못했습니다.');
    }
  };

  const handleAccessToggle = (boardType: string, role: string) => {
    const current = accessMap[boardType] || [];
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];

    setAccessMap({ ...accessMap, [boardType]: updated });
  };

  const saveAccessSettings = async (boardType: string) => {
    try {
      await api.put(
        `/boards/access/${boardType}`,
        { roles: accessMap[boardType] || [] },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(`'${boardType}' 게시판 접근 권한이 저장되었습니다.`);
    } catch (err) {
      console.error('저장 실패:', err);
      alert('접근 권한 저장 실패');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddUser = async () => {
    try {
      await api.post('/admin/users', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForm({ id: '', password: '', name: '', role: 'group1' });
      fetchUsers();
    } catch (err) {
      console.error('사용자 추가 실패:', err);
      alert('사용자 추가 실패');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error('삭제 실패:', err);
      alert('삭제 실패');
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      await api.post(`/admin/users/${id}/reset-password`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('비밀번호가 1234로 초기화되었습니다.');
    } catch (err) {
      console.error('초기화 실패:', err);
      alert('비밀번호 초기화 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 py-12 px-6">
      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl p-10 space-y-12">
        <h1 className="text-4xl font-bold text-gray-800 border-b pb-6">👑 관리자 사용자 관리</h1>

        {/* 사용자 추가 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">➕ 사용자 추가</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[{ label: '아이디', name: 'id' }, { label: '비밀번호', name: 'password' }, { label: '이름', name: 'name' }].map(
              (field) => (
                <div key={field.name} className="flex flex-col">
                  <label htmlFor={field.name} className="mb-1 text-sm font-medium text-gray-600">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.name === 'password' ? 'password' : 'text'}
                    value={form[field.name as keyof typeof form]}
                    onChange={handleChange}
                    className="rounded-xl border border-gray-300 px-4 py-3 text-base text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )
            )}

            <div className="flex flex-col">
              <label htmlFor="role" className="mb-1 text-sm font-medium text-gray-600">권한</label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="rounded-xl border border-gray-300 px-4 py-3 text-center text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 text-right">
            <button
              onClick={handleAddUser}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold rounded-xl shadow-md transition"
            >
              사용자 등록
            </button>
          </div>
        </section>

        {/* 사용자 목록 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">👥 사용자 목록</h2>
          <div className="overflow-x-auto rounded-xl border shadow">
            <table className="min-w-full text-sm text-center border-collapse">
              <thead className="bg-blue-100 text-blue-800 text-sm font-semibold">
                <tr>
                  <th className="px-4 py-3 border">아이디</th>
                  <th className="px-4 py-3 border">이름</th>
                  <th className="px-4 py-3 border">권한</th>
                  <th className="px-4 py-3 border">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border">{user.id}</td>
                    <td className="px-4 py-3 border">{user.name}</td>
                    <td className="px-4 py-3 border">{user.role}</td>
                    <td className="px-4 py-3 border">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="bg-blue-100 text-blue-700 px-4 py-1 rounded-md text-sm hover:bg-blue-200 transition"
                        >
                          🔁 암호 재설정
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-100 text-red-600 px-4 py-1 rounded-md text-sm hover:bg-red-200 transition"
                        >
                          🗑️ 계정삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ✅ 게시판 접근 권한 설정 */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">🔐 게시판 접근 권한 설정</h2>
          <div className="space-y-6">
            {boardTypes.map((board) => (
              <div key={board} className="border rounded-xl p-4 shadow bg-white">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">{board.toUpperCase()} 게시판</h3>
                  <button
                    onClick={() => saveAccessSettings(board)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium shadow transition"
                  >
                    저장
                  </button>
                </div>
                <div className="flex gap-6">
                  {roles.map((role) => (
                    <label key={role} className="inline-flex items-center gap-2 text-gray-700">
                      <input
                        type="checkbox"
                        checked={accessMap[board]?.includes(role) || false}
                        onChange={() => handleAccessToggle(board, role)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      {role}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminUserPage;
