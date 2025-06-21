import { Request, Response } from 'express'
import { Post } from '../models/Post'

// 글 등록
export const createPost = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { title, content, boardType } = req.body
    const authorEmail = req.user?.email // JWT에서 추출
    const role = req.user?.role         // JWT에서 추출

    if (!authorEmail || !role) {
      res.status(401).json({ message: '인증 정보 없음' })
      return
    }

    const post = await Post.create({
      title,
      content,
      boardType,
      authorEmail,
      role
    })

    res.status(201).json({ message: '글 등록 완료', postId: post.id })
  } catch (err) {
    console.error('글 등록 실패:', err)
    res.status(500).json({ message: '서버 오류' })
  }
}

// 글 목록 조회
export const getPosts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const posts = await Post.findAll({
      order: [['createdAt', 'DESC']]
    })
    res.json(posts)
  } catch (err) {
    res.status(500).json({ message: '목록 조회 실패' })
  }
}

// 단일 글 상세 조회
export const getPostById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params
  try {
    const post = await Post.findByPk(id)
    if (!post) {
      res.status(404).json({ message: '글을 찾을 수 없습니다.' })
      return
    }
    res.json(post)
  } catch (err) {
    res.status(500).json({ message: '글 조회 실패' })
  }
}
