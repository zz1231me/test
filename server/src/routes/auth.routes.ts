import { Router } from 'express';
import { login, register, changePassword, refreshToken, getUserPermissions } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// 공개 라우트
router.post('/login', login);
router.post('/register', register);

// 인증 필요 라우트
router.post('/change-password', authenticate, changePassword);
router.post('/refresh', authenticate, refreshToken); // ✅ 토큰 갱신 라우트 추가
router.get('/permissions', authenticate, getUserPermissions); // 🆕 권한 조회 라우트 추가

export default router;