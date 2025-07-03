// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/auth-request';
import { User } from '../models/User';
import { Role } from '../models/Role';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('❌ 인증 실패: Authorization 헤더 없음');
    res.status(401).json({ message: '인증 헤더 없음' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
    }) as { id: string };

    // ✅ 사용자 + 역할 정보 조회 (타입 안전성 개선)
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        as: 'roleInfo',
        attributes: ['id', 'name', 'description', 'isActive']
      }],
      attributes: ['id', 'name', 'roleId']
    });

    if (!user) {
      console.warn('❌ 사용자 없음');
      res.status(401).json({ message: '존재하지 않는 사용자입니다.' });
      return;
    }

    if (!user.roleInfo) {
      console.warn('❌ 역할 정보 없음');
      res.status(403).json({ message: '역할 정보가 없습니다.' });
      return;
    }

    if (!user.roleInfo.isActive) {
      console.warn('❌ 비활성화된 역할');
      res.status(403).json({ message: '비활성화된 역할입니다.' });
      return;
    }

    // ✅ req.user에 타입 안전한 정보 주입
    (req as AuthRequest).user = {
      id: user.id,
      name: user.name,
      role: user.roleInfo.id, // 역할 ID 저장
    };

    console.log('✅ 인증 성공');
    console.log(`🔐 사용자 ID: ${user.id}`);
    console.log(`🔐 이름: ${user.name}`);
    console.log(`🔐 역할 ID: ${user.roleInfo.id}`);
    console.log(`🔐 역할 이름: ${user.roleInfo.name}`);

    next();
  } catch (err) {
    console.error('❌ JWT 인증 실패:', err);
    
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: '토큰이 만료되었습니다.' });
      return;
    }
    
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
      return;
    }
    
    res.status(500).json({ message: '인증 처리 중 오류가 발생했습니다.' });
  }
};