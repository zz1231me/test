import { Router } from 'express';
import {
  createPost,
  getPosts,
  getPostById,
} from '../controllers/post.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, createPost);
router.get('/', authenticateJWT, getPosts);
router.get('/:id', authenticateJWT, getPostById);

export default router;
