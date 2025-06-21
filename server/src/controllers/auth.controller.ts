import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { User } from '../models/User' // ✅ Sequelize 모델

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password } = req.body
    const user = await User.findOne({ where: { username } })

    if (!user) {
      res.status(401).json({ message: '존재하지 않는 사용자입니다.' })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ message: '비밀번호가 틀렸습니다.' })
      return
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: '12h' }
    )

    res.json({
      message: '로그인 성공',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })
  } catch (err) {
    next(err)
  }
}

