// src/models/index.ts

import { User } from './User';
import { Post } from './Post';
import { Comment } from './Comment';

// ✅ 게시글 - 사용자 관계
User.hasMany(Post, { foreignKey: 'UserId' });
Post.belongsTo(User, { foreignKey: 'UserId' });

// ✅ 댓글 - 게시글 관계
Post.hasMany(Comment, { foreignKey: 'PostId' });
Comment.belongsTo(Post, { foreignKey: 'PostId' });

// ✅ 댓글 - 사용자 관계
User.hasMany(Comment, { foreignKey: 'UserId' });
Comment.belongsTo(User, { foreignKey: 'UserId' });

export {
  User,
  Post,
  Comment,
};
