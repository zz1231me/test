import express, { RequestHandler } from 'express';
import asyncHandler from 'express-async-handler';
import {
  getAllBoardAccess,
  getBoardAccess,
  setBoardAccess
} from '../controllers/board.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { isAdmin } from '../middlewares/isAdmin';


const router = express.Router();

const auth = authenticate as RequestHandler;
const admin = isAdmin as RequestHandler;

router.get('/access', auth, asyncHandler(getAllBoardAccess)); // ✅ 전체 목록 추가
router.get('/access/:boardType', auth, asyncHandler(getBoardAccess));
router.put('/access/:boardType', auth, admin, asyncHandler(setBoardAccess));

export default router;
