import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
} from 'sequelize';
import { sequelize } from '../config/sequelize';
import { User } from './User';
import type { User as UserType } from './User';
import { generateRandomId } from '../utils/generateId';

// ✅ PostInstance 타입 정의
export interface PostInstance
  extends Model<InferAttributes<PostInstance>, InferCreationAttributes<PostInstance>> {
  id: CreationOptional<string>;
  title: string;
  content: string;
  author: string;
  attachment?: string | null; // ✅ null 허용으로 수정
  boardType: string;
  createdAt?: Date;
  updatedAt?: Date;

  UserId: ForeignKey<string>;
  User?: UserType;
}

// ✅ Post 모델 정의
export const Post = sequelize.define<PostInstance>(
  'Post',
  {
    id: {
      type: DataTypes.STRING(8),
      primaryKey: true,
      allowNull: false,
      defaultValue: () => generateRandomId(8),
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    attachment: {
      type: DataTypes.STRING,
      allowNull: true, // ✅ DB에서도 null 허용
    },
    boardType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'general',
    },
    UserId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: 'Posts',
  }
);

// ✅ 관계 정의
User.hasMany(Post, { foreignKey: 'UserId', onDelete: 'CASCADE' });
Post.belongsTo(User, { foreignKey: 'UserId', onDelete: 'CASCADE' });
