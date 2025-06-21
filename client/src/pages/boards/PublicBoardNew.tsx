import React, { useRef, useState } from 'react'
import { Editor } from '@toast-ui/react-editor'
import { useNavigate } from 'react-router-dom'
import '@toast-ui/editor/dist/toastui-editor.css'
import { createPost } from '../../api/posts'

function PublicBoardNew() {
  const [title, setTitle] = useState('')
  const editorRef = useRef<Editor>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const content = editorRef.current?.getInstance().getMarkdown() || ''

    try {
      await createPost({
        title,
        content,
        boardType: 'public' // 게시판 종류를 구분할 수 있도록 지정
      })

      navigate('/board/public') // 등록 성공 후 목록으로 이동
    } catch (err: any) {
      console.error('글 등록 실패:', err)
      alert('글 등록에 실패했습니다.')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">✍ 글 작성</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <Editor
          ref={editorRef}
          previewStyle="vertical"
          height="400px"
          initialEditType="markdown"
          useCommandShortcut={true}
        />

        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          등록
        </button>
      </form>
    </div>
  )
}

export default PublicBoardNew
