import { Request, Response } from 'express';
import { User } from '../models/User';
import { hashPassword } from '../utils/hash';

export const getAllUsers = async (req: Request, res: Response) => {
  const users = await User.findAll({ attributes: ['id', 'username', 'name', 'role'] });
  res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
  const { username, password, name, role } = req.body;

  const existing = await User.findOne({ where: { username } });
  if (existing) return res.status(409).json({ message: '이미 존재하는 사용자입니다.' });

  const user = await User.create({
    username,
    password: hashPassword(password),
    name,
    role,
  });

  res.status(201).json({ message: '사용자 추가 완료', userId: user.id });
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id;
  const deleted = await User.destroy({ where: { id } });

  if (deleted === 0) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

  res.json({ message: '삭제 완료' });
};
