import { Router, RequestHandler } from 'express';
import {
  getAllUsers,
  createUser,
  deleteUser,
} from '../controllers/admin.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin';

const router = Router();

// ✅ 타입 명시로 해결
router.use(authenticateJWT as RequestHandler, isAdmin as RequestHandler);

router.get('/users', getAllUsers as RequestHandler);
router.post('/users', createUser as RequestHandler);
router.delete('/users/:id', deleteUser as RequestHandler);

export default router;
