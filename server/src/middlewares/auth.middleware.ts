// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: '인증 헤더 없음' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string
      role: 'admin' | 'group1' | 'group2'
    }

    req.user = {
      email: decoded.email,
      role: decoded.role
    }

    next()
  } catch (err) {
    res.status(401).json({ message: '유효하지 않은 토큰' })
  }
}
