import { Router, RequestHandler } from 'express';
import {
  getAllUsers,
  createUser,
  deleteUser,
  resetPassword,
} from '../controllers/admin.controller';
import { authenticate } from '../middlewares/auth.middleware'; // ✅ 변경된 이름
import { isAdmin } from '../middlewares/isAdmin';

const router = Router();

// ✅ 인증 및 관리자 권한 체크
router.use(authenticate as RequestHandler, isAdmin as RequestHandler);

// ✅ 관리자 사용자 관리 API
router.get('/users', getAllUsers as RequestHandler);
router.post('/users', createUser as RequestHandler);
router.delete('/users/:id', deleteUser as RequestHandler);
router.post('/users/:id/reset-password', resetPassword as RequestHandler);

export default router;
