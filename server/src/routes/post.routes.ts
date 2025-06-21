import { Router } from 'express'
import { authenticateJWT } from '../middlewares/auth.middleware'
import { createPost, getPosts, getPostById } from '../controllers/post.controller'

const router = Router()

router.post('/', authenticateJWT, createPost)
router.get('/', authenticateJWT, getPosts)
router.get('/:id', authenticateJWT, getPostById)

export default router
