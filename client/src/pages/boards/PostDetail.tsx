// src/pages/boards/PostDetail.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import { fetchPostById, deletePost } from '../../api/posts';
import CommentSection from './CommentSection';
import { Viewer } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor-viewer.css';

type Post = {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  boardType: string;
  attachment?: string;
};

type FileType = 'image' | 'document' | 'archive' | 'file';

// 상수를 컴포넌트 외부로 이동
const BOARD_TITLES: Record<string, string> = {
  notice: '공지사항',
  onboarding: '온보딩',
  shared: '공유 자료',
  internal: '내부 문서',
  free: '자유게시판'
} as const;

const FILE_TYPE_CONFIG = {
  image: {
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'],
    color: 'text-green-600 bg-green-100'
  },
  document: {
    extensions: ['pdf', 'doc', 'docx', 'txt', 'hwp', 'ppt', 'pptx', 'xls', 'xlsx'],
    color: 'text-blue-600 bg-blue-100'
  },
  archive: {
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'],
    color: 'text-orange-600 bg-orange-100'
  }
} as const;

const PostDetail = () => {
  const { boardType, id } = useParams<{ boardType: string; id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { role, name } = useAuth();

  // 현재 사용자 정보를 useMemo로 최적화
  const currentUser = useMemo(() => ({
    id: sessionStorage.getItem('id'),
    role: sessionStorage.getItem('role')
  }), []);

  // 권한 확인 로직을 useMemo로 최적화
  const canEditOrDelete = useMemo(() => {
    if (!post) return false;
    
    return (
      post.author === currentUser.id || 
      post.author === name || 
      currentUser.role === 'admin' || 
      role === 'admin'
    );
  }, [post, currentUser.id, currentUser.role, name, role]);

  const getBoardTitle = useCallback((type: string) => {
    return BOARD_TITLES[type] || type?.toUpperCase() || '게시판';
  }, []);

  // 파일 관련 유틸리티 함수들을 개선
  const fileUtils = useMemo(() => ({
    getFileType: (filePath: string): FileType => {
      const extension = filePath.split('.').pop()?.toLowerCase();
      if (!extension) return 'file';
      
      for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
        if (config.extensions.includes(extension)) {
          return type as FileType;
        }
      }
      return 'file';
    },

    getFileConfig: (fileType: FileType) => {
      return FILE_TYPE_CONFIG[fileType] || { color: 'text-gray-600 bg-gray-100' };
    },

    getFileIcon: (fileType: FileType) => {
      const iconProps = { 
        className: "w-5 h-5", 
        fill: "none", 
        stroke: "currentColor", 
        viewBox: "0 0 24 24",
        strokeWidth: 2,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const
      };
      
      switch (fileType) {
        case 'image':
          return (
            <svg {...iconProps}>
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          );
        case 'document':
          return (
            <svg {...iconProps}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          );
        case 'archive':
          return (
            <svg {...iconProps}>
              <polyline points="21,8 21,21 3,21 3,8"/>
              <rect width="18" height="5" x="3" y="3"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
          );
        default:
          return (
            <svg {...iconProps}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          );
      }
    },

    formatFileSize: (bytes?: number) => {
      if (!bytes) return '';
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
    }
  }), []);

  // 날짜 포맷팅 함수 개선
  const formatDate = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 24) {
        if (diffInHours < 1) return '방금 전';
        return `${diffInHours}시간 전`;
      } else if (diffInHours < 24 * 7) {
        const days = Math.floor(diffInHours / 24);
        return `${days}일 전`;
      } else {
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return dateString;
    }
  }, []);

  // 게시글 fetch 함수
  const fetchPost = useCallback(async () => {
    if (!boardType || !id) {
      setError('잘못된 접근입니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await fetchPostById(id);
      setPost({
        id: data.id,
        title: data.title,
        content: data.content || '내용이 없습니다.',
        author: data.author,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt || data.createdAt,
        boardType: boardType,
        attachment: data.attachment
      });
      
    } catch (err: any) {
      console.error('게시글 조회 실패:', err);
      setError(err.response?.data?.message || err.message || '게시글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [boardType, id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  // 이벤트 핸들러들
  const handleBack = useCallback(() => {
    navigate(`/dashboard/posts/${boardType}`);
  }, [navigate, boardType]);

  const handleEdit = useCallback(() => {
    if (!canEditOrDelete) {
      alert('수정 권한이 없습니다.');
      return;
    }
    navigate(`/dashboard/posts/${boardType}/edit/${id}`);
  }, [navigate, boardType, id, canEditOrDelete]);

  const handleDelete = useCallback(async () => {
    if (!canEditOrDelete) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;

    try {
      setIsDeleting(true);
      await deletePost(id!);
      alert('게시글이 삭제되었습니다.');
      navigate(`/dashboard/posts/${boardType}`);
    } catch (err: any) {
      console.error('게시글 삭제 실패:', err);
      alert(err.response?.data?.message || '게시글 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  }, [id, boardType, navigate, canEditOrDelete]);

  // 첨부파일 다운로드 처리 개선
  const handleDownload = useCallback((filePath: string) => {
    try {
      // API URL과 파일 경로를 안전하게 결합
      const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
      const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
      const fileUrl = `${baseUrl}${cleanPath}`;
      
      // 새 창에서 열기
      const link = document.createElement('a');
      link.href = fileUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드에 실패했습니다.');
    }
  }, []);

  // 스켈레톤 로더 컴포넌트
  const SkeletonLoader = () => (
    <div className="min-h-full bg-gradient-to-br from-gray-50/50 to-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* 헤더 스켈레톤 */}
        <div className="mb-8 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </div>

        {/* 본문 스켈레톤 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden mb-8 animate-pulse">
          <div className="px-4 sm:px-8 py-6 border-b border-gray-200/30">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="px-4 sm:px-8 py-8">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 로딩 상태
  if (loading) {
    return <SkeletonLoader />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-full bg-gradient-to-br from-gray-50/50 to-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-8">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-600 mb-6" role="alert">{error}</p>
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 게시글이 없는 경우
  if (!post) {
    return (
      <div className="min-h-full bg-gradient-to-br from-gray-50/50 to-white">
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-8">
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">게시글을 찾을 수 없습니다</h3>
              <p className="text-gray-600 mb-6">요청하신 게시글이 존재하지 않거나 삭제되었습니다.</p>
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const fileType = post.attachment ? fileUtils.getFileType(post.attachment) : null;
  const fileName = post.attachment?.split('/').pop() || 'attachment';
  const fileConfig = fileType ? fileUtils.getFileConfig(fileType) : null;

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50/50 to-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* 헤더 */}
        <header className="mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105"
              aria-label="뒤로 가기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {getBoardTitle(boardType!)}
                </h1>
                <p className="text-gray-600 text-sm">게시글 상세보기</p>
              </div>
            </div>
          </div>
        </header>

        {/* 게시글 내용 */}
        <main className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden mb-8">
          {/* 게시글 헤더 */}
          <header className="px-4 sm:px-8 py-6 border-b border-gray-200/30">
            {/* 제목 섹션 - 배경색 추가 */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl px-4 sm:px-6 py-4 sm:py-5 mb-6 border border-gray-200">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-relaxed break-words word-wrap">
                {post.title}
              </h1>
            </div>
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 sm:gap-6 text-sm text-gray-600 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">{post.author.charAt(0)}</span>
                  </div>
                  <span className="font-semibold text-gray-900">{post.author}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
                </div>
                
                {post.updatedAt !== post.createdAt && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>수정됨</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                </svg>
                목록
              </button>
            </div>
          </header>

          {/* 게시글 본문 */}
          <section className="px-4 sm:px-8 py-8">
            <div className="prose prose-lg max-w-none">
              <style jsx global>{`
                /* Toast UI Viewer 커스텀 스타일 */
                .toastui-editor-contents {
                  font-family: 'Nanum Gothic', sans-serif !important;
                  line-height: 1.8 !important;
                  color: #374151 !important;
                  word-break: break-word !important;
                  overflow-wrap: break-word !important;
                }

                /* 이미지 크기 제한 */
                .toastui-editor-contents img {
                  max-width: 100% !important;
                  height: auto !important;
                  border-radius: 8px !important;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
                  margin: 16px 0 !important;
                  display: block !important;
                }

                /* 테이블 스타일링 개선 */
                .toastui-editor-contents table {
                  width: 100% !important;
                  border-collapse: collapse !important;
                  margin: 20px 0 !important;
                  background: white !important;
                  border-radius: 8px !important;
                  overflow: hidden !important;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                  border: 1px solid #e5e7eb !important;
                }

                .toastui-editor-contents thead {
                  background-color: #f8fafc !important;
                }

                .toastui-editor-contents table th {
                  background-color: #f1f5f9 !important;
                  color: #1e293b !important;
                  font-weight: 600 !important;
                  padding: 12px 16px !important;
                  border: 1px solid #cbd5e1 !important;
                  text-align: left !important;
                  font-size: 14px !important;
                  white-space: nowrap !important;
                }

                .toastui-editor-contents table td {
                  padding: 12px 16px !important;
                  border: 1px solid #e2e8f0 !important;
                  color: #475569 !important;
                  font-size: 14px !important;
                  vertical-align: top !important;
                  word-break: break-word !important;
                }

                .toastui-editor-contents tbody tr:nth-child(odd) {
                  background-color: #ffffff !important;
                }

                .toastui-editor-contents tbody tr:nth-child(even) {
                  background-color: #f8fafc !important;
                }

                .toastui-editor-contents tbody tr:hover {
                  background-color: #e2e8f0 !important;
                  transition: background-color 0.2s ease !important;
                }

                /* 코드 블록 스타일링 */
                .toastui-editor-contents pre {
                  background-color: #1f2937 !important;
                  color: #f9fafb !important;
                  padding: 20px !important;
                  border-radius: 8px !important;
                  overflow-x: auto !important;
                  margin: 16px 0 !important;
                  font-family: 'Courier New', monospace !important;
                  font-size: 14px !important;
                  line-height: 1.5 !important;
                }

                .toastui-editor-contents code {
                  background-color: #f3f4f6 !important;
                  color: #dc2626 !important;
                  padding: 2px 6px !important;
                  border-radius: 4px !important;
                  font-family: 'Courier New', monospace !important;
                  font-size: 0.9em !important;
                }

                .toastui-editor-contents pre code {
                  background-color: transparent !important;
                  color: inherit !important;
                  padding: 0 !important;
                }

                /* 인용구 스타일링 */
                .toastui-editor-contents blockquote {
                  border-left: 4px solid #3b82f6 !important;
                  background-color: #eff6ff !important;
                  padding: 16px 20px !important;
                  margin: 16px 0 !important;
                  border-radius: 0 8px 8px 0 !important;
                  color: #1e40af !important;
                  font-style: italic !important;
                }

                .toastui-editor-contents blockquote p {
                  margin: 0 !important;
                }

                /* 제목 스타일링 */
                .toastui-editor-contents h1 {
                  font-size: 2rem !important;
                  font-weight: 700 !important;
                  color: #111827 !important;
                  margin: 32px 0 16px 0 !important;
                  padding-bottom: 8px !important;
                  border-bottom: 2px solid #e5e7eb !important;
                }

                .toastui-editor-contents h2 {
                  font-size: 1.75rem !important;
                  font-weight: 600 !important;
                  color: #111827 !important;
                  margin: 28px 0 14px 0 !important;
                  padding-bottom: 6px !important;
                  border-bottom: 1px solid #e5e7eb !important;
                }

                .toastui-editor-contents h3 {
                  font-size: 1.5rem !important;
                  font-weight: 600 !important;
                  color: #111827 !important;
                  margin: 24px 0 12px 0 !important;
                }

                .toastui-editor-contents h4 {
                  font-size: 1.25rem !important;
                  font-weight: 600 !important;
                  color: #111827 !important;
                  margin: 20px 0 10px 0 !important;
                }

                .toastui-editor-contents h5,
                .toastui-editor-contents h6 {
                  font-size: 1.125rem !important;
                  font-weight: 600 !important;
                  color: #111827 !important;
                  margin: 16px 0 8px 0 !important;
                }

                /* 단락 스타일링 */
                .toastui-editor-contents p {
                  margin: 16px 0 !important;
                  line-height: 1.8 !important;
                  color: #374151 !important;
                  word-break: break-word !important;
                }

                /* 링크 스타일링 */
                .toastui-editor-contents a {
                  color: #3b82f6 !important;
                  text-decoration: underline !important;
                  transition: color 0.2s ease !important;
                }

                .toastui-editor-contents a:hover {
                  color: #1d4ed8 !important;
                }

                /* 리스트 스타일링 */
                .toastui-editor-contents ul,
                .toastui-editor-contents ol {
                  margin: 16px 0 !important;
                  padding-left: 24px !important;
                }

                .toastui-editor-contents li {
                  margin: 4px 0 !important;
                  line-height: 1.6 !important;
                }

                .toastui-editor-contents ul li {
                  list-style-type: disc !important;
                }

                .toastui-editor-contents ol li {
                  list-style-type: decimal !important;
                }

                /* 구분선 스타일링 */
                .toastui-editor-contents hr {
                  border: none !important;
                  height: 2px !important;
                  background: linear-gradient(to right, #e5e7eb, #9ca3af, #e5e7eb) !important;
                  margin: 32px 0 !important;
                  border-radius: 1px !important;
                }

                /* 강조 텍스트 */
                .toastui-editor-contents strong {
                  font-weight: 700 !important;
                  color: #111827 !important;
                }

                .toastui-editor-contents em {
                  font-style: italic !important;
                  color: #6b7280 !important;
                }

                /* 체크박스 리스트 */
                .toastui-editor-contents .task-list-item {
                  list-style: none !important;
                  margin: 8px 0 !important;
                }

                .toastui-editor-contents .task-list-item input[type="checkbox"] {
                  margin-right: 8px !important;
                  transform: scale(1.2) !important;
                }

                /* 반응형 처리 */
                @media (max-width: 640px) {
                  .toastui-editor-contents {
                    font-size: 14px !important;
                  }

                  .toastui-editor-contents h1 {
                    font-size: 1.75rem !important;
                  }

                  .toastui-editor-contents h2 {
                    font-size: 1.5rem !important;
                  }

                  .toastui-editor-contents h3 {
                    font-size: 1.25rem !important;
                  }

                  .toastui-editor-contents table {
                    font-size: 12px !important;
                  }

                  .toastui-editor-contents table th,
                  .toastui-editor-contents table td {
                    padding: 8px 10px !important;
                  }

                  .toastui-editor-contents pre {
                    padding: 12px !important;
                    font-size: 12px !important;
                  }

                  .toastui-editor-contents blockquote {
                    padding: 12px 16px !important;
                  }
                }

                /* 스크롤 가능한 테이블 컨테이너 개선 */
                .toastui-editor-contents .table-wrapper {
                  overflow-x: auto !important;
                  margin: 20px 0 !important;
                  border-radius: 8px !important;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                  border: 1px solid #e5e7eb !important;
                  background: white !important;
                }

                .toastui-editor-contents .table-wrapper table {
                  margin: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                }

                .toastui-editor-contents .table-wrapper::-webkit-scrollbar {
                  height: 8px !important;
                }

                .toastui-editor-contents .table-wrapper::-webkit-scrollbar-track {
                  background: #f1f5f9 !important;
                  border-radius: 4px !important;
                }

                .toastui-editor-contents .table-wrapper::-webkit-scrollbar-thumb {
                  background: #cbd5e1 !important;
                  border-radius: 4px !important;
                }

                .toastui-editor-contents .table-wrapper::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8 !important;
                }
              `}</style>
              
              {post.contentType === 'html' ? (
                // HTML 콘텐츠는 dangerouslySetInnerHTML로 렌더링
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                  style={{
                    lineHeight: '1.8',
                    fontSize: '16px',
                    color: '#374151'
                  }}
                />
              ) : (
                // 마크다운 콘텐츠는 Viewer로 렌더링
                <Viewer
                  initialValue={post.content}
                  theme="light"
                  height="auto"
                  extendedAutolinks={true}
                  linkAttributes={{
                    target: '_blank',
                    rel: 'noopener noreferrer'
                  }}
                />
              )}
            </div>
          </section>

          {/* 첨부파일 섹션 */}
          {post.attachment && fileType && fileConfig && (
            <section className="px-4 sm:px-8 py-6 border-t border-gray-200/30 bg-gray-50/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">첨부파일</h2>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${fileConfig.color}`}>
                  {fileUtils.getFileIcon(fileType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate" title={fileName}>
                    {fileName}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {fileType} 파일
                  </div>
                </div>
                
                <button
                  onClick={() => handleDownload(post.attachment!)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                  aria-label={`${fileName} 다운로드`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">다운로드</span>
                </button>
              </div>
            </section>
          )}

          {/* 게시글 하단 액션 */}
          <footer className="px-4 sm:px-8 py-4 bg-gray-50/50 border-t border-gray-200/30">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                목록으로 돌아가기
              </button>
              
              {canEditOrDelete && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-sm"
                    disabled={isDeleting}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline">수정하기</span>
                  </button>
                  
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 sm:px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-sm"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">삭제 중...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">삭제하기</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </footer>
        </main>

        {/* 댓글 섹션 */}
        <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
          <header className="px-4 sm:px-8 py-6 border-b border-gray-200/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">댓글</h2>
            </div>
          </header>
          
          <div className="px-4 sm:px-8 py-6">
            <CommentSection postId={id!} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default PostDetail;