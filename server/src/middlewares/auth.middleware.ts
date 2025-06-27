// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/auth-request';

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('❌ 인증 실패: Authorization 헤더 없음');
    res.status(401).json({ message: '인증 헤더 없음' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      name: string;
      role: 'admin' | 'group1' | 'group2';
    };

    // ✅ 인증 성공 시 유저 정보 주입
    (req as AuthRequest).user = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role,
    };

    console.log('✅ 인증 성공');
    console.log(`🔐 사용자 ID: ${decoded.id}`);
    console.log(`🔐 이름: ${decoded.name}`);
    console.log(`🔐 역할: ${decoded.role}`);

    next();
  } catch (err) {
    console.error('❌ JWT 인증 실패:', err);
    res.status(401).json({ message: '유효하지 않은 토큰' });
  }
};
