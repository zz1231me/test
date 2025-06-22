import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { hashPassword } from '../utils/hash'; // SHA256 해시 유틸

// 🔐 로그인
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      res.status(401).json({ message: '존재하지 않는 사용자입니다.' });
      return;
    }

    const inputHash = hashPassword(password);
    console.log('📥 입력된 평문 비밀번호:', password);
    console.log('🔐 입력값 해시:', inputHash);
    console.log('🗄️ DB 저장된 해시:', user.password);

    if (inputHash !== user.password) {
      res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
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
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// 👤 회원 등록 (admin용 또는 최초 회원 등록용)
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password, name, role } = req.body;

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      res.status(409).json({ message: '이미 존재하는 사용자입니다.' });
      return;
    }

    const hashedPassword = hashPassword(password);

    const user = await User.create({
      username,
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
