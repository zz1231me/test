// src/models/Post.ts
import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../config/sequelize'

export class Post extends Model {
  public id!: number
  public title!: string
  public content!: string
  public boardType!: string
  public authorEmail!: string
  public role!: string
  public readonly createdAt!: Date
}

Post.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    boardType: {
      type: DataTypes.ENUM('notice', 'onboarding', 'secui-only', 'free'),
      allowNull: false
    },
    authorEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'group1', 'group2'),
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'Post',
    tableName: 'posts',
    timestamps: true,
    updatedAt: false
  }
)
