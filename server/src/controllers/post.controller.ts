// src/controllers/post.controller.ts
import { Response } from 'express';
import { Post } from '../models/Post';
import { User } from '../models/User';
import { AuthRequest } from '../types/auth-request';
import sanitizeHtml from 'sanitize-html';

// ✅ HTML 정화 옵션
const sanitizeOptions = {
  allowedTags: [...sanitizeHtml.defaults.allowedTags, 'pre', 'code'], 
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src', 'alt'],
  },
  disallowedTagsMode: 'discard' as const,
  textFilter: (text: string) => {
    return text.replace(/&gt;/g, '>');
  },
};

// ✅ 게시글 목록 조회 - content 제외
export const getPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const boardType = req.params.boardType;
    
    const posts = await Post.findAll({
      where: { boardType },
      include: [{
        model: User,
        as: 'user', // Post 모델에서 정의한 alias
        attributes: ['id', 'name']
      }],
      attributes: ['id', 'title', 'createdAt', 'author', 'UserId'], // content 제외
      order: [['createdAt', 'DESC']],
    });

    // 응답 데이터 정리
    const formattedPosts = posts.map(post => ({
      id: post.id,
      title: post.title,
      author: post.user?.name || post.author || 'Unknown',
      createdAt: post.createdAt,
      UserId: post.UserId
    }));

    res.json(formattedPosts);
  } catch (err) {
    console.error('❌ getPosts error:', err);
    res.status(500).json({ message: '게시글 목록 조회 실패' });
  }
};

// ✅ 게시글 상세 조회
export const getPostById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user', // Post 모델에서 정의한 alias
        attributes: ['id', 'name']
      }],
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
      updatedAt: post.updatedAt,
      author: post.user?.name || post.author || 'Unknown',
      UserId: post.UserId,
      boardType: post.boardType,
      attachment: post.attachment ? `/uploads/files/${post.attachment}` : null,
    });
  } catch (err) {
    console.error('❌ getPostById error:', err);
    res.status(500).json({ message: '게시글 조회 실패' });
  }
};

// ✅ 게시글 생성
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    const boardType = req.params.boardType;
    const file = req.file;

    if (!req.user) {
      res.status(401).json({ message: '인증이 필요합니다.' });
      return;
    }

    if (!title || !content) {
      res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
      return;
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      res.status(400).json({ message: '제목과 내용을 입력해주세요.' });
      return;
    }

    const cleanContent = sanitizeHtml(content, sanitizeOptions);

    const post = await Post.create({
      title: title.trim(),
      content: cleanContent,
      boardType,
      author: req.user.name || 'Unknown',
      attachment: file ? file.filename : null,
      UserId: req.user.id,
    });

    // 생성된 게시글과 사용자 정보 함께 조회
    const postWithUser = await Post.findByPk(post.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name']
      }]
    });

    res.status(201).json(postWithUser);
  } catch (err) {
    console.error('❌ createPost error:', err);
    res.status(500).json({ message: '게시글 생성 실패' });
  }
};

// ✅ 게시글 수정
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    const file = req.file;
    const { id } = req.params;

    if (!title || !content) {
      res.status(400).json({ message: '제목과 내용을 모두 입력해주세요.' });
      return;
    }

    if (title.trim().length === 0 || content.trim().length === 0) {
      res.status(400).json({ message: '제목과 내용을 입력해주세요.' });
      return;
    }

    const post = await Post.findByPk(id);

    if (!post) {
      res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      return;
    }

    // 권한 확인
    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?.id === post.UserId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ message: '수정 권한이 없습니다.' });
      return;
    }

    const cleanContent = sanitizeHtml(content, sanitizeOptions);

    // 게시글 업데이트
    await post.update({
      title: title.trim(),
      content: cleanContent,
      ...(file && { attachment: file.filename })
    });

    // 수정된 게시글과 사용자 정보 함께 조회
    const updatedPost = await Post.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name']
      }]
    });

    res.json(updatedPost);
  } catch (err) {
    console.error('❌ updatePost error:', err);
    res.status(500).json({ message: '게시글 수정 실패' });
  }
};

// ✅ 게시글 삭제
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
      return;
    }

    // 권한 확인
    const isAdmin = req.user?.role === 'admin';
    const isOwner = req.user?.id === post.UserId;

    if (!isAdmin && !isOwner) {
      res.status(403).json({ message: '삭제 권한이 없습니다.' });
      return;
    }

    await post.destroy();
    res.json({ message: '게시글이 삭제되었습니다.' });
  } catch (err) {
    console.error('❌ deletePost error:', err);
    res.status(500).json({ message: '게시글 삭제 실패' });
  }
};