import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database'

export class User extends Model {
  public id!: number
  public username!: string
  public password!: string
  public name!: string
  public role!: string
  public readonly createdAt!: Date
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false
    }
  },
  {
    tableName: 'users',
    sequelize
  }
)
