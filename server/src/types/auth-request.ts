// src/types/auth-request.ts
import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: 'admin' | 'group1' | 'group2';
  };
}
