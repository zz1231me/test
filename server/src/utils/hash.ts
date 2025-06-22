import crypto from 'crypto';

const SALT = '1111'; // 필요하면 .env로 분리

export function hashPassword(password: string, rounds = 1111): string {
  let hash = password + SALT;
  for (let i = 0; i < rounds; i++) {
    hash = crypto.createHash('sha256').update(hash).digest('hex');
  }
  return hash;
}
