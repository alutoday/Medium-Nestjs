export class CommentEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  body: string;
  author: {
    username: string;
    bio: string | null;
    image: string | null;
  };

  constructor(comment: any) {
    this.id = comment.id;
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;
    this.body = comment.body;
    this.author = {
      username: comment.author.username,
      bio: comment.author.bio,
      image: comment.author.image,    };
  }
}