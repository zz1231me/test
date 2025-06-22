// src/types/auth-request.ts (새 파일 생성)
import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'group1' | 'group2';
  };
}
