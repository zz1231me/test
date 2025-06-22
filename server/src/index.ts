import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import { sequelize } from './config/sequelize'; // ✅ DB 연결 추가
import './models/User'; // ✅ 모델 등록
import './models/Post'; // ✅ 필요 시 게시글 모델도 등록
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('✅ 서버 실행 중');
});

// ✅ Sequelize 연결 및 테이블 자동 생성
sequelize
  .sync({ alter: true }) // { force: true }는 개발 초기 전용 (기존 테이블 삭제 후 재생성)
  .then(() => {
    console.log('🗄️ DB 연결 및 테이블 동기화 완료');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB 연결 실패:', err);
  });

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
