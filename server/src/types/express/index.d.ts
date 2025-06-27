// src/types/express/index.d.ts

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: 'admin' | 'group1' | 'group2';
      };
    }
  }
}

export {}; // 👈 반드시 필요함!
