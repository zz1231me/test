// src/models/Post.ts
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../config/sequelize';
import { generateRandomId } from '../utils/generateId';

// 타입 전용 import
import type { UserInstance } from './User';
import type { Board } from './Board';

// ✅ PostInstance 타입 정의
export interface PostInstance
  extends Model<InferAttributes<PostInstance>, InferCreationAttributes<PostInstance>> {
  id: CreationOptional<string>;
  title: string;
  content: string;
  author: string;
  attachment?: string | null;
  boardType: string;
  UserId: ForeignKey<string>;
  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;

  // 관계 데이터
  user?: NonAttribute<UserInstance>;
  board?: NonAttribute<Board>;
}

// ✅ Post 모델을 class 방식으로 통일
export class Post extends Model<InferAttributes<PostInstance>, InferCreationAttributes<PostInstance>> 
  implements PostInstance {
  
  public id!: CreationOptional<string>;
  public title!: string;
  public content!: string;
  public author!: string;
  public attachment?: string | null;
  public boardType!: string;
  public UserId!: ForeignKey<string>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // 관계 데이터
  public user?: NonAttribute<UserInstance>;
  public board?: NonAttribute<Board>;
}

// 모델 초기화
Post.init(
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
      allowNull: true,
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: true,
    tableName: 'Posts',
    modelName: 'Post',
  }
);

// 🚨 관계 정의 제거 - models/index.ts에서만!