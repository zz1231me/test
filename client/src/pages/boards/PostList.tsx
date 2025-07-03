// src/pages/boards/PostList.tsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { fetchPostsByType } from '../../api/posts';
import { fetchBoardAccess } from '../../api/boards';
import { useAuth } from '../../store/auth';

type Post = {
  id: string;
  title: string;
  createdAt: string;
  author: string;
};

type BoardInfo = {
  id: string;
  name: string;
  description: string;
};

const PostList = () => {
  const { boardType } = useParams<{ boardType: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [boardInfo, setBoardInfo] = useState<BoardInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  // 검색 필터링을 메모이제이션
  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) return posts;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return posts.filter(post =>
      post.title.toLowerCase().includes(searchLower) ||
      post.author.toLowerCase().includes(searchLower)
    );
  }, [posts, searchTerm]);

  // 날짜 포맷팅 함수를 메모이제이션
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
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
        month: 'short',
        day: 'numeric'
      });
    }
  }, []);

  // 이벤트 핸들러들을 useCallback으로 최적화
  const handlePostClick = useCallback((postId: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (boardType) {
      const targetPath = `/dashboard/posts/${boardType}/${postId}`;
      navigate(targetPath);
    }
  }, [boardType, navigate]);

  const handleNewPost = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (boardType) {
      const targetPath = `/dashboard/posts/${boardType}/new`;
      navigate(targetPath);
    }
  }, [boardType, navigate]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // ✅ 기본값 설정 함수
  const setDefaultBoardInfo = useCallback((boardId: string) => {
    const defaultTitles: Record<string, string> = {
      notice: '공지사항',
      onboarding: '온보딩',
      shared: '공유 자료',
      internal: '내부 문서',
      free: '자유게시판'
    };
    
    setBoardInfo({
      id: boardId,
      name: defaultTitles[boardId] || boardId.charAt(0).toUpperCase() + boardId.slice(1),
      description: '게시글 목록을 확인하세요'
    });
  }, []);

  // 데이터 로딩
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!boardType || !role) return;

      try {
        setLoading(true);
        setError(null);

        console.log(`🔍 PostList 권한 체크 시작: boardType=${boardType}, role=${role}`);

        // 1. 게시판 접근 권한 확인
        const accessRes = await fetchBoardAccess(boardType);
        console.log('🔍 PostList API 응답:', accessRes.data);
        
        const allowedRoles = accessRes.data.roles;
        const hasAccess = allowedRoles.some((roleObj: any) => roleObj.roleId === role);
        
        console.log(`🔍 권한 체크 결과: ${hasAccess ? '허용' : '거부'}`);

        if (!hasAccess) {
          console.warn(`❌ PostList에서 권한 없음 - unauthorized로 이동`);
          navigate('/unauthorized');
          return;
        }

        // ✅ 2. 게시판 정보 설정 (권한 API 응답에서 가져오기)
        if (accessRes.data.boardName) {
          setBoardInfo({
            id: boardType,
            name: accessRes.data.boardName,
            description: accessRes.data.boardDescription || '게시글 목록을 확인하세요'
          });
          console.log('✅ 게시판 정보 설정:', accessRes.data.boardName);
        } else {
          // 응답에 게시판 정보가 없으면 기본값 사용
          console.log('⚠️ API 응답에 게시판 정보 없음, 기본값 사용');
          setDefaultBoardInfo(boardType);
        }

        // 3. 게시글 목록 가져오기
        const postList = await fetchPostsByType(boardType);
        if (isMounted) {
          setPosts(postList);
          console.log(`✅ 게시글 ${postList.length}개 로드 완료`);
        }
      } catch (err: any) {
        console.error('게시글 불러오기 실패:', err);
        if (isMounted) {
          setError(err.response?.data?.message || err.message || '게시글을 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [boardType, role, navigate, setDefaultBoardInfo]);

  // 스켈레톤 로더 컴포넌트
  const SkeletonLoader = () => (
    <div className="divide-y divide-gray-200/30">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="px-8 py-6 animate-pulse">
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-7">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-gray-200 rounded-full mt-3 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                </div>
              </div>
            </div>
            <div className="col-span-2 text-center">
              <div className="h-6 bg-gray-200 rounded-full w-16 mx-auto"></div>
            </div>
            <div className="col-span-3 text-center">
              <div className="h-4 bg-gray-200 rounded-md w-20 mx-auto"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // boardType이 없으면 null 반환
  if (!boardType) {
    return (
      <div className="min-h-full bg-gradient-to-br from-gray-50/50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">잘못된 접근입니다</h3>
          <p className="text-gray-600">올바른 게시판을 선택해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-50/50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* ✅ 헤더 섹션 - 관리자가 설정한 정보 표시 */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  {/* ✅ 관리자가 설정한 게시판 이름 */}
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1">
                    {boardInfo?.name || '게시판'}
                  </h1>
                  {/* ✅ 관리자가 설정한 게시판 설명 */}
                  <p className="text-gray-600">
                    {boardInfo?.description || '게시글 목록을 확인하세요'}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-sm font-medium text-gray-500">
                      총 {posts.length}개
                    </span>
                    {searchTerm && filteredPosts.length !== posts.length && (
                      <span className="text-sm text-blue-600 font-medium">
                        '{searchTerm}' 검색 결과 {filteredPosts.length}개
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleNewPost}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                aria-label="새 글 작성하기"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                새 글 작성
              </button>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm p-4">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="제목이나 작성자로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                aria-label="게시글 검색"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="검색어 지우기"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
          {/* 로딩 상태 */}
          {loading && (
            <div>
              <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200/50 px-8 py-4">
                <div className="grid grid-cols-12 gap-6 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  <div className="col-span-7">제목</div>
                  <div className="col-span-2 text-center">작성자</div>
                  <div className="col-span-3 text-center">작성일</div>
                </div>
              </div>
              <SkeletonLoader />
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3 text-red-700">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {!loading && !error && filteredPosts.length === 0 && (
            <div className="text-center py-16">
              {searchTerm ? (
                <div>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-600 mb-6">'{searchTerm}'에 대한 결과를 찾을 수 없습니다.</p>
                  <button
                    onClick={clearSearch}
                    className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    검색 초기화
                  </button>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">아직 게시글이 없습니다</h3>
                  <p className="text-gray-600 mb-6">첫 번째 게시글을 작성해보세요.</p>
                  <button
                    onClick={handleNewPost}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    첫 글 작성하기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 게시글 목록 */}
          {!loading && !error && filteredPosts.length > 0 && (
            <div>
              {/* 테이블 헤더 */}
              <div className="bg-gray-50/80 backdrop-blur-sm border-b border-gray-200/50 px-8 py-4">
                <div className="grid grid-cols-12 gap-6 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  <div className="col-span-7">제목</div>
                  <div className="col-span-2 text-center">작성자</div>
                  <div className="col-span-3 text-center">작성일</div>
                </div>
              </div>

              {/* 게시글 목록 */}
              <div className="divide-y divide-gray-200/30">
                {filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={(e) => handlePostClick(post.id, e)}
                    className="px-8 py-6 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 cursor-pointer transition-all duration-300 group border-l-4 border-l-transparent hover:border-l-blue-400 focus-within:bg-blue-50/20 focus-within:border-l-blue-400"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handlePostClick(post.id);
                      }
                    }}
                    aria-label={`${post.title} 게시글 보기 - ${post.author} 작성`}
                  >
                    <div className="grid grid-cols-12 gap-6 items-center">
                      {/* 제목 */}
                      <div className="col-span-7">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-3 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"></div>
                          <div>
                            <h3 className="text-gray-900 font-semibold group-hover:text-blue-600 transition-colors text-lg leading-relaxed line-clamp-2">
                              {post.title}
                            </h3>
                          </div>
                        </div>
                      </div>

                      {/* 작성자 */}
                      <div className="col-span-2 text-center">
                        <span className="text-gray-700 font-medium bg-gray-100/50 px-3 py-1.5 rounded-full text-sm">
                          {post.author}
                        </span>
                      </div>
                      
                      {/* 작성일 */}
                      <div className="col-span-3 text-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostList;