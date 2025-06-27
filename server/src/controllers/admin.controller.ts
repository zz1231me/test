import { Request, Response } from 'express';
import { User } from '../models/User';
import { hashPassword } from '../utils/hash';

// 🔍 모든 사용자 조회
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'role'] });
    res.json(users);
  } catch (err) {
    console.error('❌ getAllUsers error:', err);
    res.status(500).end();
  }
};

// 👤 사용자 생성 (id 기반, 오류 메시지 출력 없음)
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, password, name, role } = req.body;

    if (!id || !password || !name || !role) {
      res.status(400).end();
      return;
    }

    const existing = await User.findByPk(id);
    if (existing) {
      res.status(409).end();
      return;
    }

    const user = await User.create({
      id,
      password: hashPassword(password),
      name,
      role,
    });

    res.status(201).json({ userId: user.id });
  } catch (err) {
    console.error('❌ createUser error:', err);
    res.status(500).end();
  }
};

// 🗑️ 사용자 삭제
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const deleted = await User.destroy({ where: { id } });

    if (deleted === 0) {
      res.status(404).end();
      return;
    }

    res.json({ message: '삭제 완료' });
  } catch (err) {
    console.error('❌ deleteUser error:', err);
    res.status(500).end();
  }
};

// 🔒 비밀번호 초기화
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const defaultPassword = '1234';
    const hashed = hashPassword(defaultPassword);

    const updated = await User.update(
      { password: hashed },
      { where: { id } }
    );

    if (updated[0] === 0) {
      res.status(404).end();
      return;
    }

    res.json({ message: '비밀번호가 1234로 초기화되었습니다.' });
  } catch (err) {
    console.error('❌ resetPassword error:', err);
    res.status(500).end();
  }
};
