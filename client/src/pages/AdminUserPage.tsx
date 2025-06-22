import React, { useEffect, useState } from 'react';
import api from '../utils/axios'

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'group1' });
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('http://localhost:4000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      alert('사용자 목록을 불러오지 못했습니다.');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddUser = async () => {
    try {
      await api.post('http://localhost:4000/api/admin/users', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForm({ username: '', password: '', name: '', role: 'group1' });
      fetchUsers();
    } catch (err) {
      alert('사용자 추가 실패');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await api.delete(`http://localhost:4000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      alert('삭제 실패');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-12 px-6">
      <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-xl p-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-10 border-b pb-4">👑 관리자 사용자 관리</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">➕ 사용자 추가</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col">
              <label htmlFor="username" className="mb-1 text-sm text-gray-600">아이디</label>
              <input id="username" name="username" value={form.username} onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="password" className="mb-1 text-sm text-gray-600">비밀번호</label>
              <input id="password" name="password" type="password" value={form.password} onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="name" className="mb-1 text-sm text-gray-600">이름</label>
              <input id="name" name="name" value={form.name} onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col">
              <label htmlFor="role" className="mb-1 text-sm text-gray-600">권한</label>
              <select id="role" name="role" value={form.role} onChange={handleChange}
                className="border border-gray-300 rounded-lg px-4 py-2 w-full text-center focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="admin">admin</option>
                <option value="group1">group1</option>
                <option value="group2">group2</option>
              </select>
            </div>
          </div>
          <div className="mt-6 text-right">
            <button onClick={handleAddUser}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all">
              사용자 등록
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">👥 사용자 목록</h2>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white border text-sm text-center">
              <thead className="bg-blue-50 text-blue-800 font-medium">
                <tr>
                  <th className="px-4 py-2 border">ID</th>
                  <th className="px-4 py-2 border">아이디</th>
                  <th className="px-4 py-2 border">이름</th>
                  <th className="px-4 py-2 border">권한</th>
                  <th className="px-4 py-2 border">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border">{user.id}</td>
                    <td className="px-4 py-2 border">{user.username}</td>
                    <td className="px-4 py-2 border">{user.name}</td>
                    <td className="px-4 py-2 border">{user.role}</td>
                    <td className="px-4 py-2 border">
                      <button onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 font-medium">
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminUserPage;
