import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { hashPassword } from '../utils/hash';
import { AuthRequest } from '../types/auth-request';

// 🔐 로그인 (id 기반)
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, password } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(401).json({ message: '존재하지 않는 사용자입니다.' });
      return;
    }

    const inputHash = hashPassword(password);
    if (inputHash !== user.password) {
      res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '12h' }
    );

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// 👤 회원 등록 (id 기반)
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, password, name, role } = req.body;

    // ✅ 필드 검증
    if (!id || !password || !name || !role) {
      res.status(400).json({ message: '모든 필드를 입력해주세요.' });
      return;
    }

    const existing = await User.findByPk(id);
    if (existing) {
      res.status(409).json({ message: '이미 존재하는 사용자입니다.' });
      return;
    }

    const hashedPassword = hashPassword(password);

    const user = await User.create({
      id,
      password: hashedPassword,
      name,
      role,
    });

    res.status(201).json({
      message: '사용자 등록 완료',
      userId: user.id,
    });
  } catch (err) {
    next(err);
  }
};

// 🔒 비밀번호 변경
export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  const authReq = req as AuthRequest;

  if (!authReq.user) {
    res.status(401).json({ message: '인증 정보가 없습니다.' });
    return;
  }

  const user = await User.findByPk(authReq.user.id);
  if (!user) {
    res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    return;
  }

  const currentHashed = hashPassword(currentPassword);
  if (user.password !== currentHashed) {
    res.status(400).json({ message: '현재 비밀번호가 틀렸습니다.' });
    return;
  }

  user.password = hashPassword(newPassword);
  await user.save();

  res.status(200).json({ message: '비밀번호가 변경되었습니다.' });
};
