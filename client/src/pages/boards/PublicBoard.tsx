import React from 'react'
import { Link } from 'react-router-dom'

const dummyPosts = [
  { id: 1, title: '첫 번째 글입니다', author: 'admin@example.com', createdAt: '2025-06-21' },
  { id: 2, title: '두 번째 글이에요', author: 'user@dhl.com', createdAt: '2025-06-20' }
]

function PublicBoard() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📢 공용 게시판</h1>
        <Link
          to="/board/public/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          글쓰기
        </Link>
      </div>

      <div className="border-t">
        {dummyPosts.map((post) => (
          <div
            key={post.id}
            className="border-b py-3 flex justify-between items-center hover:bg-gray-50"
          >
            <Link to={`/board/public/${post.id}`} className="text-lg text-blue-700 font-medium">
              {post.title}
            </Link>
            <div className="text-sm text-gray-500 text-right">
              <div>{post.author}</div>
              <div>{post.createdAt}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PublicBoard
