declare namespace Express {
  export interface Request {
    user?: {
      id: string
      role: 'admin' | 'group1' | 'group2'
    }
  }
}
