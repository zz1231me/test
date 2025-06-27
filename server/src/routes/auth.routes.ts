import { Router } from 'express';
import { login, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware'; // ✅ 수정: verifyToken → authenticate

const router = Router();

router.post('/login', login);
router.post('/change-password', authenticate, changePassword); // ✅ 수정: verifyToken → authenticate

export default router;
