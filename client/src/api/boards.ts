// src/api/boards.ts
import api from './axios';

// 기존 단일 게시판 접근 권한 조회
export const fetchBoardAccess = (boardType: string) => {
  return api.get(`/boards/access/${boardType}`);
};

// ✅ 추가: 전체 게시판 + 권한 목록 조회
export const fetchAllBoardAccess = () => {
  return api.get('/boards/access');
};