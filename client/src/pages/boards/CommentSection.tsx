import React, { useEffect, useState, useCallback } from 'react';
import axios from '../../api/axios';

type Comment = {
  id: number;
  content: string;
  createdAt: string;
  UserId: string;
  User?: {
    name: string;
  };
};

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
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

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/comments/${postId}`);
      setComments(res.data);
    } catch (err: any) {
      console.error('댓글 불러오기 실패:', err);
      setError(err.message || '댓글을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await axios.post(`/comments/${postId}`, { content: newComment });
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
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await axios.delete(`/comments/${commentId}`);
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
    if (postId) fetchComments();
  }, [postId, fetchComments]);

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
        <div className="space-y-3 text-sm">
          {comments.map((comment) => {
            const isOwner = currentUserId === comment.UserId;
            const canDelete = isAdmin || isOwner;

            return (
              <div key={comment.id} className="pb-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mt-1">
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 whitespace-pre-wrap break-words leading-snug mb-1">
                      {comment.content}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{`${formatDate(comment.createdAt)} / ${comment.User?.name || comment.UserId}`}</span>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-700 px-2 py-0.5 border border-red-200 hover:border-red-300 rounded whitespace-nowrap transition"
                          title="댓글 삭제"
                          aria-label="댓글 삭제"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>삭제</span>
                        </button>
                      )}
                    </div>
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
