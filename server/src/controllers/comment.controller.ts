// comment.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types/auth-request'; // ✅ 이거 import
import { Comment, User } from '../models';

// ✅ 댓글 작성
export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: '로그인이 필요합니다.' });
    return;
  }

  try {
    const newComment = await Comment.create({
      content,
      PostId: postId,
      UserId: userId,
    });

    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ message: '댓글 작성 실패', error: err });
  }
};

// ✅ 게시글의 댓글 조회
export const getCommentsByPost = async (req: AuthRequest, res: Response): Promise<void> => {
  const { postId } = req.params;

  try {
    const comments = await Comment.findAll({
      where: { PostId: postId },
      include: [
        {
          model: User,
          attributes: ['name'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: '댓글 조회 실패', error: err });
  }
};

// ✅ 댓글 삭제
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { commentId } = req.params;
  const userId = req.user?.id;
  const userRole = req.user?.role;

  try {
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      res.status(404).json({ message: '댓글을 찾을 수 없습니다.' });
      return;
    }

    if (userRole !== 'admin' && comment.getDataValue('UserId') !== userId) {
      res.status(403).json({ message: '삭제 권한이 없습니다.' });
      return;
    }

    await comment.destroy();
    res.status(200).json({ message: '댓글이 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ message: '댓글 삭제 실패', error: err });
  }
};
