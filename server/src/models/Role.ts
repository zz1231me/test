// server/src/models/Role.ts
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from 'sequelize';
import { sequelize } from '../config/sequelize';

// ✅ RoleInstance 타입 정의
export interface RoleInstance
  extends Model<InferAttributes<RoleInstance>, InferCreationAttributes<RoleInstance>> {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ✅ Role 모델 정의
export const Role = sequelize.define<RoleInstance>(
  'Role',
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    modelName: 'Role',
    tableName: 'roles',
    timestamps: true,
  }
);
