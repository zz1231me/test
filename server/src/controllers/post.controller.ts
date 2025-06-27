import { Response } from 'express';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { AuthRequest } from '../types/auth-request';
import sanitizeHtml from 'sanitize-html';

// ✅ HTML 정화 옵션
const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags,
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src', 'alt'],
  },
  disallowedTagsMode: 'discard' as const,
};

// ✅ 게시글 목록 조회 - content 제외
export const getPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const boardType = req.params.boardType;
    const posts = await Post.findAll({
      where: { boardType },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title', 'createdAt', 'author'], // ← content 제외
    });
    res.json(posts);
  } catch (err) {
    console.error('❌ getPosts error:', err);
    res.status(500).json({ message: '서버 에러' });
  }
};

// ✅ 게시글 상세 조회
export const getPostById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['name'] }],
    });

    if (!post) {
      res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      return;
    }

    res.json({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      author: post.User?.name || 'unknown',
      UserId: post.UserId,
      boardType: post.boardType,
      attachment: post.attachment ? `/uploads/files/${post.attachment}` : null,
    });
  } catch (err) {
    console.error('❌ getPostById error:', err);
    res.status(500).json({ message: '서버 에러' });
  }
};

// ✅ 게시글 생성
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    const boardType = req.params.boardType;
    const file = req.file;

    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const cleanContent = sanitizeHtml(content, sanitizeOptions);

    const post = await Post.create({
      title,
      content: cleanContent,
      boardType,
      author: req.user.name ?? 'unknown',
      attachment: file ? file.filename : null,
      UserId: req.user.id,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error('❌ createPost error:', err);
    res.status(500).json({ message: '글 생성 실패' });
  }
};

// ✅ 게시글 수정
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    const file = req.file;
    const { id } = req.params;

    const post = await Post.findByPk(id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?.id === post.UserId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ message: '수정 권한이 없습니다' });
      return;
    }

    const cleanContent = sanitizeHtml(content, sanitizeOptions);

    post.title = title;
    post.content = cleanContent;
    if (file) post.attachment = file.filename;

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('❌ updatePost error:', err);
    res.status(500).json({ message: '글 수정 실패' });
  }
};

// ✅ 게시글 삭제
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }

    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?.id === post.UserId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ message: '삭제 권한이 없습니다' });
      return;
    }

    await post.destroy();
    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error('❌ deletePost error:', err);
    res.status(500).json({ message: '글 삭제 실패' });
  }
};
