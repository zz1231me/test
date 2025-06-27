// models/User.ts
import { DataTypes, Model, HasManyGetAssociationsMixin } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { Post } from './Post'; // ✅ Post 모델 import
import type { PostInstance } from './Post'; // 🔑 타입만 분리 import

export class User extends Model {
  public id!: number;
  public username!: string;
  public password!: string;
  public name!: string;
  public role!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // ✅ 관계 메서드 타입 (선택적)
  public getPosts!: HasManyGetAssociationsMixin<PostInstance>;
}

// ✅ 모델 초기화
// models/User.ts
User.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
  },
  {
    tableName: 'users',
    sequelize,
  }
);

