// src/types/express/index.d.ts
import { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string
        role: 'admin' | 'group1' | 'group2'
      }
    }
  }
}
