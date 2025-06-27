import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sequelize';
import { Post } from './Post';
import { User } from './User';

class Comment extends Model {}

Comment.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'Comment',
  tableName: 'comments',
  timestamps: true,
});

Comment.belongsTo(Post, { foreignKey: 'PostId' });
Comment.belongsTo(User, { foreignKey: 'UserId' });

export { Comment }; // ✅ 이걸 꼭 추가
