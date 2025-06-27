/// <reference path="./types/express/index.d.ts" />
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import adminRoutes from './routes/admin.routes';
import eventRoutes from './routes/event.routes';
import uploadRoutes from './routes/upload.routes';
import boardRoutes from './routes/board.routes';
import commentRoutes from './routes/comment.routes';
import { sequelize } from './config/sequelize';

// ✅ 모델 및 관계 등록
import './models'; // models/index.ts를 자동 실행하여 관계 설정

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ 미들웨어
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ✅ 헬스체크
app.get('/', (req, res) => {
  res.send('✅ 서버 실행 중');
});

// ✅ API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/comments', commentRoutes);


// ✅ 정적 파일 제공 - 경로 수정됨!
app.use(
  '/uploads/images',
  express.static(path.resolve(__dirname, '../uploads/images'))
);
app.use(
  '/uploads/files',
  express.static(path.resolve(__dirname, '../uploads/files')) // ✅ 수정: 상대경로 → 절대경로로 상위 폴더 참조
);

// ✅ 디버깅 경로
app.get('/__debug-upload-path', (req, res) => {
  const imagePath = path.resolve(__dirname, '../uploads/images');
  const filePath = path.resolve(__dirname, '../uploads/files');
  res.send(
    `📁 이미지 경로: ${imagePath}<br>📄 파일 경로: ${filePath}`
  );
});

// ✅ DB 연결 및 서버 시작
sequelize
  .sync({ alter: true }) // 개발용
  .then(() => {
    console.log('🗄️ DB 연결 및 테이블 동기화 완료');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB 연결 실패:', err);
  });
