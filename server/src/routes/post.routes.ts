import { Router } from 'express';
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
import { AuthRequest } from '../types/auth-request';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto'; // ✅ 랜덤 파일명 생성을 위한 import

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
    const randomName = crypto.randomBytes(5).toString('hex'); // ✅ 10자리 영문숫자 랜덤
    cb(null, `${randomName}${ext}`);
  },
});

const upload = multer({ storage });

/**
 * ✅ 공개 라우트
 */

// 게시글 목록 조회 (게시판별)
router.get(
  '/:boardType',
  asyncHandler((req, res) => getPosts(req as AuthRequest, res))
);

// 게시글 단건 조회
router.get(
  '/detail/:id',
  asyncHandler((req, res) => getPostById(req as AuthRequest, res))
);

/**
 * ✅ 인증이 필요한 라우트
 */
router.use(authenticate);

// 게시글 생성
router.post(
  '/:boardType',
  upload.single('file'),
  asyncHandler((req, res) => createPost(req as AuthRequest, res))
);

// 게시글 수정
router.put(
  '/:boardType/:id',
  upload.single('file'),
  asyncHandler((req, res) => updatePost(req as AuthRequest, res))
);

// 게시글 삭제
router.delete(
  '/:id',
  asyncHandler((req, res) => deletePost(req as AuthRequest, res))
);

export default router;
