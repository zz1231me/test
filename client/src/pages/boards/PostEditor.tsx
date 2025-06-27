// src/pages/boards/PostEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/toastui-editor-viewer.css';
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
import '@toast-ui/editor-plugin-color-syntax/dist/toastui-editor-plugin-color-syntax.css';
import '@toast-ui/editor-plugin-table-merged-cell/dist/toastui-editor-plugin-table-merged-cell.css';
import '@toast-ui/editor/dist/i18n/ko-kr';
import 'prismjs/themes/prism.css';
import Prism from 'prismjs';

import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import chart from '@toast-ui/editor-plugin-chart';
import colorSyntax from '@toast-ui/editor-plugin-color-syntax';
import tableMergedCell from '@toast-ui/editor-plugin-table-merged-cell';
import uml from '@toast-ui/editor-plugin-uml';

import { fetchPostById, createPost, updatePost } from '../../api/posts';

type Props = {
  mode: 'create' | 'edit';
};

const PostEditor = ({ mode }: Props) => {
  const { id, boardType } = useParams<{ id: string; boardType: string }>();
  const navigate = useNavigate();
  const editorRef = useRef<Editor>(null);

  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 제목 글자수 제한
  const MAX_TITLE_LENGTH = 40;

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    let isMounted = true;

    if (mode === 'edit' && id) {
      const fetchData = async () => {
        try {
          const post = await fetchPostById(id);
          if (isMounted) {
            setTitle(post.title);
            editorRef.current?.getInstance()?.setMarkdown(post.content || '');
            if (post.attachment) {
              setAttachmentUrl(`${import.meta.env.VITE_API_URL}${post.attachment}`);
            }
          }
        } catch (err) {
          console.error('게시글 불러오기 실패:', err);
          alert('글을 불러오는 데 실패했습니다.');
        }
      };
      fetchData();
    }

    return () => {
      isMounted = false;
    };
  }, [mode, id]);

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!boardType) {
      alert('게시판 유형이 없습니다.');
      return;
    }

    const content = editorRef.current?.getInstance()?.getMarkdown() || '';
    
    try {
      setLoading(true);

      const payload = { title, content, boardType, file };

      if (mode === 'edit' && id) {
        await updatePost(id, payload);
        alert('수정 완료');
        navigate(`/dashboard/posts/${boardType}/${id}`);
      } else if (mode === 'create') {
        await createPost(payload);
        alert('작성 완료');
        navigate(`/dashboard/posts/${boardType}`);
      }
    } catch (err: any) {
      console.error('저장 실패:', err);
      alert(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 에디터 내 이미지 업로드 처리
  const handleImageUpload = async (
    blob: Blob,
    callback: (url: string, alt: string) => void
  ) => {
    try {
      const formData = new FormData();
      formData.append('image', blob);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/uploads/images`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      callback(data.imageUrl, '업로드된 이미지');
    } catch (err) {
      console.error('이미지 업로드 실패:', err);
      alert('이미지 업로드에 실패했습니다.');
    }
  };

  // 첨부파일 삭제
  const handleAttachmentDelete = () => {
    setAttachmentUrl(null);
    setFile(null);
  };

  // 제목 변경 핸들러 (글자수 제한)
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_TITLE_LENGTH) {
      setTitle(value);
    }
  };

  // 파일 선택 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const isEditMode = mode === 'edit';
  const pageTitle = isEditMode ? '게시글 수정' : '새 게시글 작성';
  const submitButtonText = isEditMode ? '✨ 수정하기' : '🚀 작성하기';

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50/50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-8 space-y-8">
          {/* 페이지 제목 */}
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {pageTitle}
            </h1>
          </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 제목 입력 섹션 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white text-lg">✏️</span>
                </div>
                <label htmlFor="title" className="text-xl font-bold text-gray-800 whitespace-nowrap">
                  제목
                </label>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <input
                    id="title"
                    type="text"
                    className="w-full bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 rounded-xl shadow-sm text-xl font-medium text-gray-800 placeholder-gray-500 transition-all duration-300 hover:shadow-md focus:shadow-lg hover:from-purple-50 hover:to-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="멋진 제목을 입력해주세요..."
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    {title.length}/{MAX_TITLE_LENGTH}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 에디터 섹션 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-lg">📝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">내용 작성</h3>
            </div>
            <div className="rounded-xl overflow-hidden shadow-inner border border-gray-200">
              <Editor
                ref={editorRef}
                previewStyle="vertical"
                height="500px"
                initialEditType="wysiwyg"
                useCommandShortcut={true}
                language="ko-KR"
                hooks={{ addImageBlobHook: handleImageUpload }}
                toolbarItems={[
                  ['heading', 'bold', 'italic', 'strike'],
                  ['hr', 'quote'],
                  ['ul', 'ol', 'task'],
                  ['table', 'link', 'image', 'code', 'codeblock'],
                ]}
              />
            </div>
          </div>

          {/* 첨부파일 섹션 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white text-lg">📎</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">첨부파일</h3>
            </div>
            
            <div className="space-y-4">
              {/* 기존 첨부파일 표시 (수정 모드) */}
              {isEditMode && attachmentUrl && (
                <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white text-sm">📄</span>
                    </div>
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-green-700 hover:text-green-800 hover:underline break-all transition-colors"
                    >
                      {attachmentUrl.split('/').pop()}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={handleAttachmentDelete}
                    className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white hover:shadow-md transition-all text-xs font-bold"
                    title="첨부파일 삭제"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* 파일 업로드 영역 */}
              <div className="relative">
                <input
                  type="file"
                  id="file-upload"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl px-6 py-8 text-center cursor-pointer hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 group-hover:from-purple-500 group-hover:to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 shadow-lg">
                    <span className="text-white text-2xl">📁</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-700 group-hover:text-blue-700 transition-colors mb-2">
                    {file 
                      ? `선택된 파일: ${file.name}` 
                      : attachmentUrl 
                        ? '파일 변경하기' 
                        : '파일 선택하기'
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    클릭하거나 파일을 드래그해서 업로드하세요
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 섹션 */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-10 py-4 rounded-2xl text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 font-bold transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-10 py-4 rounded-2xl text-white font-bold shadow-xl transition-all duration-300 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105'
              }`}
            >
              {loading ? '처리 중...' : submitButtonText}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default PostEditor;