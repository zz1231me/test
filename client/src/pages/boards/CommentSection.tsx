import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../api/axios';

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  UserId: string;
  User?: {
    name: string;
  };
  user?: {  // ✅ 실제 백엔드 응답 구조 추가
    id: string;
    name: string;
  };
};

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { boardType } = useParams<{ boardType: string }>(); // ✅ boardType 가져오기
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const token = sessionStorage.getItem('token');
  const currentUserId = sessionStorage.getItem('id')?.trim();
  const currentUserRole = sessionStorage.getItem('role')?.trim();
  const isAuthenticated = !!token;
  const isAdmin = currentUserRole === 'admin';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mi = String(date.getMinutes()).padStart(2, '0');
    return `${yy}.${mm}.${dd}(${hh}:${mi})`;
  };

  // ✅ 사용자 이름에서 첫 글자 추출하는 함수
  const getInitial = (name: string) => {
    return name?.charAt(0) || '?';
  };

  // ✅ 사용자별 고유한 그라데이션 색상 생성 함수
  const getGradientColors = (name: string) => {
    const gradients = [
      'from-emerald-500 to-teal-500',
      'from-blue-500 to-cyan-500', 
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-green-500 to-lime-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500',
      'from-yellow-500 to-orange-500',
      'from-teal-500 to-green-500',
      'from-cyan-500 to-blue-500'
    ];
    
    // 이름을 기반으로 일관된 색상 선택
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  const fetchComments = useCallback(async () => {
    if (!boardType) return; // ✅ boardType 체크
    
    setLoading(true);
    setError('');
    try {
      // ✅ Option 2 방식: /comments/:boardType/:postId
      const res = await axios.get(`/comments/${boardType}/${postId}`);
      setComments(res.data);
    } catch (err: any) {
      console.error('댓글 불러오기 실패:', err);
      setError(err.message || '댓글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [postId, boardType]); // ✅ boardType 의존성 추가

  const handleSubmit = async () => {
    if (!newComment.trim() || !boardType) return; // ✅ boardType 체크

    setSubmitting(true);
    try {
      // ✅ Option 2 방식: /comments/:boardType/:postId
      await axios.post(`/comments/${boardType}/${postId}`, { content: newComment });
      setNewComment('');
      await fetchComments();
    } catch (err: any) {
      console.error('댓글 작성 실패:', err);
      alert(err.message || '댓글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?') || !boardType) return; // ✅ boardType 체크

    try {
      // ✅ Option 2 방식: /comments/:boardType/:commentId
      await axios.delete(`/comments/${boardType}/${commentId}`);
      await fetchComments();
    } catch (err: any) {
      console.error('댓글 삭제 실패:', err);
      alert(err.message || '댓글 삭제에 실패했습니다.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (postId && boardType) fetchComments(); // ✅ boardType 체크 추가
  }, [postId, boardType, fetchComments]); // ✅ boardType 의존성 추가

  return (
    <div className="space-y-5">
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-600 text-sm">댓글을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3 text-red-700">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm">아직 댓글이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          {comments.map((comment) => {
            const isOwner = currentUserId === comment.UserId;
            const canDelete = isAdmin || isOwner;
            // ✅ 실제 백엔드 응답에 맞게 수정 (user 소문자)
            const userName = comment.user?.name || comment.User?.name || comment.UserId;
            const userInitial = getInitial(userName);
            const gradientColors = getGradientColors(userName);

            // ✅ 디버깅을 위한 로그 (개발 시에만)
            if (process.env.NODE_ENV === 'development') {
              console.log('Comment user info:', {
                user: comment.user,
                User: comment.User,
                UserId: comment.UserId,
                userName: userName
              });
            }

            return (
              <div key={comment.id} className="pb-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start gap-3">
                  {/* ✅ PostDetail과 같은 스타일의 프로필 아바타 */}
                  <div className={`w-8 h-8 bg-gradient-to-br ${gradientColors} rounded-lg flex items-center justify-center flex-shrink-0 mt-1`}>
                    <span className="text-white text-sm font-bold">{userInitial}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* 사용자 이름과 시간 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-gray-900 text-sm">{userName}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                    </div>
                    
                    {/* 댓글 내용 */}
                    <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed mb-2">
                      {comment.content}
                    </p>
                    
                    {/* 삭제 버튼 */}
                    {canDelete && (
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 hover:border-red-300 rounded-md text-xs font-medium transition-colors hover:bg-red-50"
                          title="댓글 삭제"
                          aria-label="댓글 삭제"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>삭제</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAuthenticated ? (
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              rows={3}
              placeholder="댓글을 입력하세요..."
              disabled={submitting}
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? '작성 중...' : '댓글 작성'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 text-sm">댓글을 작성하려면 로그인해주세요</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;