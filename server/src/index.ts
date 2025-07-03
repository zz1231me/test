/// <reference path="./types/express/index.d.ts" />
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// ✅ 라우트 import
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import adminRoutes from './routes/admin.routes';
import eventRoutes from './routes/event.routes';
import uploadRoutes from './routes/upload.routes';
import boardRoutes from './routes/board.routes';
import commentRoutes from './routes/comment.routes';

// ✅ 데이터베이스 설정
import { sequelize } from './config/sequelize';

// ✅ 모든 모델 import (관계 설정을 위해 필요!)
import { User } from './models/User';
import { Role } from './models/Role';
import { Post } from './models/Post';
import { Comment } from './models/Comment';
import Board from './models/Board';
import BoardAccess from './models/BoardAccess';
import Event from './models/Event';
import EventPermission from './models/EventPermission'; // 🆕 EventPermission 추가

// ✅ 데이터 마이그레이션 함수
import { runMigrationIfNeeded } from './scripts/migrate-data';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ✅ 모델 관계 설정 함수
const setupModelAssociations = () => {
  console.log('🔗 모델 관계 설정 시작...');

  // 1️⃣ User ↔ Role 관계 (수정됨!)
  User.belongsTo(Role, {
    foreignKey: 'roleId',  // ⚠️ 'role'이 아닌 'roleId'로 수정
    targetKey: 'id',
    as: 'roleInfo',        // ⚠️ 'role'이 아닌 'roleInfo'로 수정 (auth.middleware.ts와 일치)
  });
  Role.hasMany(User, {
    foreignKey: 'roleId',  // ⚠️ 'role'이 아닌 'roleId'로 수정
    sourceKey: 'id',
    as: 'users',
  });

  // 2️⃣ User ↔ Post 관계
  User.hasMany(Post, { 
    foreignKey: 'UserId', 
    as: 'posts',
    onDelete: 'CASCADE' 
  });
  Post.belongsTo(User, { 
    foreignKey: 'UserId', 
    as: 'user',
    onDelete: 'CASCADE' 
  });

  // 3️⃣ Post ↔ Comment 관계
  Post.hasMany(Comment, { 
    foreignKey: 'PostId', 
    as: 'comments',
    onDelete: 'CASCADE' 
  });
  Comment.belongsTo(Post, { 
    foreignKey: 'PostId', 
    as: 'post',
    onDelete: 'CASCADE' 
  });

  // 4️⃣ User ↔ Comment 관계
  User.hasMany(Comment, { 
    foreignKey: 'UserId', 
    as: 'comments',
    onDelete: 'CASCADE' 
  });
  Comment.belongsTo(User, { 
    foreignKey: 'UserId', 
    as: 'user',
    onDelete: 'CASCADE' 
  });

  // 5️⃣ Board ↔ Role 다대다 관계 (BoardAccess 중간 테이블)
  Board.belongsToMany(Role, {
    through: BoardAccess,
    foreignKey: 'boardId',
    otherKey: 'roleId',
    as: 'AccessibleRoles',
  });

  Role.belongsToMany(Board, {
    through: BoardAccess,
    foreignKey: 'roleId',
    otherKey: 'boardId',
    as: 'AccessibleBoards',
  });

  // 6️⃣ BoardAccess ↔ Board, Role 관계
  BoardAccess.belongsTo(Board, {
    foreignKey: 'boardId',
    as: 'board',
  });
  BoardAccess.belongsTo(Role, {
    foreignKey: 'roleId',
    as: 'role',
  });

  Board.hasMany(BoardAccess, {
    foreignKey: 'boardId',
    as: 'accesses',
  });
  Role.hasMany(BoardAccess, {
    foreignKey: 'roleId',
    as: 'accesses',
  });

  // 7️⃣ Post ↔ Board 관계
  Post.belongsTo(Board, {
    foreignKey: 'boardType',
    targetKey: 'id',
    as: 'board',
  });
  Board.hasMany(Post, {
    foreignKey: 'boardType',
    sourceKey: 'id',
    as: 'posts',
  });

  // 8️⃣ User ↔ Event 관계
  User.hasMany(Event, {
    foreignKey: 'UserId',
    as: 'events',
    onDelete: 'CASCADE'
  });
  Event.belongsTo(User, {
    foreignKey: 'UserId',
    as: 'user',
    onDelete: 'CASCADE'
  });

  // 🆕 9️⃣ Role ↔ EventPermission 관계
  Role.hasOne(EventPermission, {
    foreignKey: 'roleId',
    as: 'eventPermission'
  });
  EventPermission.belongsTo(Role, {
    foreignKey: 'roleId',
    as: 'role'
  });

  console.log('✅ 모든 모델 관계 설정 완료');
};

// ✅ 미들웨어
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ✅ 헬스체크
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ 서버 실행 중',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/comments', commentRoutes);

// ✅ 정적 파일 제공
app.use(
  '/uploads/images',
  express.static(path.resolve(__dirname, '../uploads/images'))
);
app.use(
  '/uploads/files',
  express.static(path.resolve(__dirname, '../uploads/files'))
);

// ✅ 디버깅 경로
app.get('/__debug-upload-path', (req, res) => {
  const imagePath = path.resolve(__dirname, '../uploads/images');
  const filePath = path.resolve(__dirname, '../uploads/files');
  res.json({
    paths: {
      images: imagePath,
      files: filePath
    },
    exists: {
      images: require('fs').existsSync(imagePath),
      files: require('fs').existsSync(filePath)
    }
  });
});

// ✅ 모델 관계 디버깅 엔드포인트
app.get('/__debug-models', (req, res) => {
  res.json({
    models: {
      User: !!User,
      Role: !!Role,
      Post: !!Post,
      Comment: !!Comment,
      Board: !!Board,
      BoardAccess: !!BoardAccess,
      Event: !!Event,
      EventPermission: !!EventPermission, // 🆕 EventPermission 추가
    },
    associations: {
      User: Object.keys(User.associations || {}),
      Role: Object.keys(Role.associations || {}),
      Post: Object.keys(Post.associations || {}),
      Comment: Object.keys(Comment.associations || {}),
      Board: Object.keys(Board.associations || {}),
      BoardAccess: Object.keys(BoardAccess.associations || {}),
      Event: Object.keys(Event.associations || {}),
      EventPermission: Object.keys(EventPermission.associations || {}), // 🆕 EventPermission 관계 추가
    }
  });
});

// ✅ DB 연결 및 서버 시작
const startServer = async () => {
  try {
    console.log('🔄 서버 초기화 시작...');

    // 1. 데이터베이스 연결 테스트
    console.log('🗄️ 데이터베이스 연결 확인 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    // 2. 모델 관계 설정 (테이블 동기화 전에!)
    setupModelAssociations();

    // 3. 테이블 동기화
    console.log('🔄 테이블 동기화 시작...');
    await sequelize.sync({ 
      alter: process.env.NODE_ENV === 'development',
      force: false // ⚠️ 절대 true로 설정하지 마세요 (데이터 손실 위험)
    });
    console.log('✅ 테이블 동기화 완료');

    // 4. 데이터 마이그레이션 실행
    console.log('📊 데이터 마이그레이션 시작...');
    await runMigrationIfNeeded();
    console.log('✅ 데이터 마이그레이션 완료');

    // 5. 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 서버가 http://localhost:${PORT}에서 실행 중`);
      console.log('📋 주요 API 엔드포인트:');
      console.log('   🔐 인증: POST /api/auth/login');
      console.log('   📝 게시판: GET /api/boards');
      console.log('   📄 게시글: GET /api/posts');
      console.log('   ⚙️  관리자: GET /api/admin/users');
      console.log('   📅 이벤트: GET /api/events');
      console.log('   📁 업로드: POST /api/uploads');
      console.log('   💬 댓글: GET /api/comments');
      console.log('');
      console.log('🔧 디버깅 엔드포인트:');
      console.log('   📊 모델 상태: GET /__debug-models');
      console.log('   📁 업로드 경로: GET /__debug-upload-path');
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    if (error instanceof Error) {
      console.error('오류 이름:', error.name);
      console.error('오류 메시지:', error.message);
      if (process.env.NODE_ENV === 'development') {
        console.error('스택 트레이스:', error.stack);
      }
    }
    process.exit(1);
  }
};

// 예외 처리
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception thrown:', error);
  process.exit(1);
});

// 서버 시작
startServer();