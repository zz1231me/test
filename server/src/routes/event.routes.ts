import express, { RequestHandler } from 'express';
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} from '../controllers/event.controller';
import { authenticate } from '../middlewares/auth.middleware'; // ✅ 이름 수정
import { authorizeRoles } from '../middlewares/role.middleware';

const router = express.Router();

// ✅ 미들웨어를 명시적으로 캐스팅
const authenticateJWT = authenticate as RequestHandler;
const authRoles = (...roles: string[]) =>
  authorizeRoles(...roles) as RequestHandler;

const requireAuth = [authenticateJWT, authRoles('admin', 'group1', 'group2')];
const requireAdmin = [authenticateJWT, authRoles('admin')];

// ✅ 라우터 등록
router.post('/', ...requireAuth, createEvent as RequestHandler);
router.get('/', ...requireAuth, getEvents as RequestHandler);
router.put('/:id', ...requireAdmin, updateEvent as RequestHandler);
router.delete('/:id', ...requireAdmin, deleteEvent as RequestHandler);

export default router;
