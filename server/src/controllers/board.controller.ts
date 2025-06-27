import { Request, Response } from 'express';
import BoardAccess from '../models/BoardAccess';
import { Sequelize } from 'sequelize';

// ✅ 단일 게시판 접근 권한 조회
export const getBoardAccess = async (req: Request, res: Response): Promise<void> => {
  const { boardType } = req.params;

  try {
    const accessList = await BoardAccess.findAll({ where: { boardType } });
    const roles = accessList.map((entry) => entry.role);
    res.json({ boardType, roles });
    return;
  } catch (err) {
    res.status(500).json({ message: '접근 권한 조회 실패', error: err });
    return;
  }
};

// ✅ 게시판 접근 권한 설정
export const setBoardAccess = async (req: Request, res: Response): Promise<void> => {
  const { boardType } = req.params;
  const { roles } = req.body;

  if (!Array.isArray(roles)) {
    res.status(400).json({ message: 'roles는 배열이어야 합니다.' });
    return;
  }

  try {
    await BoardAccess.destroy({ where: { boardType } }); // 기존 권한 삭제
    const entries = roles.map((role) => ({ boardType, role }));
    await BoardAccess.bulkCreate(entries);
    res.json({ message: '접근 권한 설정 완료', boardType, roles });
    return;
  } catch (err) {
    res.status(500).json({ message: '접근 권한 설정 실패', error: err });
    return;
  }
};

// ✅ 전체 게시판 + 권한 목록 조회 (사이드바용)
export const getAllBoardAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const allAccess = await BoardAccess.findAll({
      attributes: ['boardType', 'role'],
      raw: true,
    });

    const grouped: Record<string, string[]> = {};
    for (const { boardType, role } of allAccess) {
      if (!grouped[boardType]) grouped[boardType] = [];
      grouped[boardType].push(role);
    }

    const result = Object.entries(grouped).map(([type, roles]) => ({
      type,
      roles,
    }));

    res.json(result);
  } catch (err) {
    console.error('getAllBoardAccess error:', err);
    res.status(500).json({ message: '전체 접근 권한 조회 실패', error: err });
  }
};
