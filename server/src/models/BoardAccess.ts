// server/src/models/BoardAccess.ts

import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize';

// ✅ 타입을 명시적으로 지정해주기
class BoardAccess extends Model {
  public boardType!: string;
  public role!: 'admin' | 'group1' | 'group2';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

BoardAccess.init(
  {
    boardType: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    role: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
  },
  {
    sequelize,
    modelName: 'BoardAccess',
    tableName: 'board_accesses',
    timestamps: true,
  }
);

export default BoardAccess;
