import express, { Request, Response } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads/images');

// ✅ 폴더 없으면 생성
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ multer 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, ext); // 디렉토리 경로 제거
    const hash = crypto.createHash('md5').update(Date.now() + safeName).digest('hex');

    cb(null, `${hash}${ext}`);
  },
});

// ✅ 파일 필터링 (선택적으로 적용 가능)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExts.includes(ext)) {
    return cb(new Error('허용되지 않은 파일 형식입니다'));
  }

  cb(null, true);
};

const upload = multer({ storage, fileFilter });

// ✅ 업로드 핸들러
router.post('/images', upload.single('image'), (req: Request, res: Response): void => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ message: '파일이 없습니다' });
    return;
  }

  const imageUrl = `/uploads/images/${file.filename}`;
  res.status(200).json({ imageUrl });
});

export default router;
