import { Tag } from "@prisma/client";

export class ArticleEntity {
  constructor(article: any) {
    this.article = {
      slug: article.slug,
      title: article.title,
      description: article.description,
      body: article.body,
      tagList: article.tagList.map((tag: Tag) => tag.name) || [],
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      favorited: article.favorited ?? false,
      favoritesCount: article.favoritesCount ?? 0,
      author: {
        username: article.author.username,
        bio: article.author.bio,
        image: article.author.image,
        following: article.isFollowing ?? false,
      },
    };
  }

  article: any;
}
