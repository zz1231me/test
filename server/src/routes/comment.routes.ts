// src/routes/comment.routes.ts
import express, { RequestHandler } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createComment,
  getCommentsByPost,
  deleteComment,
} from '../controllers/comment.controller';

const router = express.Router();

// 타입 단언으로 Express가 받아들일 수 있도록 처리
router.post('/:postId', authenticate, createComment as RequestHandler);
router.get('/:postId', getCommentsByPost as RequestHandler);
router.delete('/:commentId', authenticate, deleteComment as RequestHandler);

export default router;
