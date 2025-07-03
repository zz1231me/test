import { Router, RequestHandler } from 'express';
import multer from 'multer';
import asyncHandler from 'express-async-handler';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkBoardAccess } from '../middlewares/boardAccess.middleware';
import { AuthRequest } from '../types/auth-request';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();

/**
 * ✅ 파일 업로드 설정 (uploads/files 디렉토리 보장)
 */
const uploadDir = path.join(__dirname, '../../uploads/files');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const ext = path.extname(file.originalname);
    const randomName = crypto.randomBytes(5).toString('hex');
    cb(null, `${randomName}${ext}`);
  },
});

const upload = multer({ storage });

/**
 * ✅ 게시글 목록 조회 (게시판별) - 읽기 권한 필요
 */
router.get(
  '/:boardType',
  authenticate as RequestHandler,                       // ✅ JWT 인증
  checkBoardAccess('read') as RequestHandler,          // ✅ 게시판 읽기 권한 체크
  asyncHandler((req, res) => getPosts(req as AuthRequest, res))
);

/**
 * ✅ 게시글 단건 조회 - 읽기 권한 필요
 */
router.get(
  '/:boardType/:id',
  authenticate as RequestHandler,                       // ✅ JWT 인증
  checkBoardAccess('read') as RequestHandler,          // ✅ 게시판 읽기 권한 체크
  asyncHandler((req, res) => getPostById(req as AuthRequest, res))
);

/**
 * ✅ 게시글 생성 - 쓰기 권한 필요
 */
router.post(
  '/:boardType',
  authenticate as RequestHandler,                       // ✅ JWT 인증
  checkBoardAccess('write') as RequestHandler,         // ✅ 게시판 쓰기 권한 체크
  upload.single('file'),
  asyncHandler((req, res) => createPost(req as AuthRequest, res))
);

/**
 * ✅ 게시글 수정 - 쓰기 권한 필요
 */
router.put(
  '/:boardType/:id',
  authenticate as RequestHandler,                       // ✅ JWT 인증
  checkBoardAccess('write') as RequestHandler,         // ✅ 게시판 쓰기 권한 체크
  upload.single('file'),
  asyncHandler((req, res) => updatePost(req as AuthRequest, res))
);

/**
 * ✅ 게시글 삭제 - 삭제 권한 필요
 */
router.delete(
  '/:boardType/:id',
  authenticate as RequestHandler,                       // ✅ JWT 인증
  checkBoardAccess('delete') as RequestHandler,        // ✅ 게시판 삭제 권한 체크
  asyncHandler((req, res) => deletePost(req as AuthRequest, res))
);

export default router;