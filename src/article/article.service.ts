import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';
import { Article, Tag, User, Follow } from '@prisma/client';
import { UpdateArticleDto } from './dto/update-article.dto';
import { FilterArticlesDto } from './dto/filter-article.dto';
import { DEFAULT_SKIP, DEFAULT_TAKE } from 'src/common/pagination.constants';

type FullArticle = Article & {
  tagList: Tag[];
  author: User;
  favorited?: boolean;
  favoritesCount?: number;
  isFollowing?: boolean;
};

@Injectable()
export class ArticleService {
  constructor(private prisma: PrismaService) {}

  private generateSlug(title: string) {
    return slugify(title, { lower: true }) + '-' + Date.now();
  }

  async create(userId: number, dto: CreateArticleDto) {
    const slug = this.generateSlug(dto.title);

    const tags =
      dto.tagList?.map((tag) => ({
        where: { name: tag },
        create: { name: tag },
      })) || [];

    const article = await this.prisma.article.create({
      data: {
        slug,
        title: dto.title,        
        description: dto.description,
        body: dto.body,
        authorId: userId,
        tagList: {
          connectOrCreate: tags,
        },
      },
      include: {
        author: true,
        tagList: true,
      },
    });

    return article;
  }

  async findBySlug(slug: string, userId?: number): Promise<FullArticle> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tagList: true,
      },
    });
    if (!article) throw new NotFoundException('Article not found');

    return this.buildSingleArticleResponse(article, userId);
  }

  async buildSingleArticleResponse(
    article: FullArticle,
    userId?: number,
  ): Promise<FullArticle> {
    const [favorited, favoritesCount, isFollowing] = await Promise.all([
      userId ? this.isFavorited(userId, article.id) : false,
      this.countFavorites(article.id),
      userId ? this.isFollowing(userId, article.authorId) : false,
    ]);

    return {
      ...article,
      favorited,
      favoritesCount,
      isFollowing
    };
  }

  async isFavorited(userId: number, articleId: number): Promise<boolean> {
    const fav = await this.prisma.favoriteArticles.findFirst({
      where: { userId, articleId },
    });
    return !!fav;
  }

  async countFavorites(articleId: number): Promise<number> {
    return this.prisma.favoriteArticles.count({ where: { articleId } });
  }

  async update(
    slug: string,
    userId: number,
    dto: UpdateArticleDto,
  ): Promise<FullArticle> {
    const existing = await this.prisma.article.findUnique({
      where: { slug },
      include: { tagList: true },
    });

    if (!existing) {
      throw new NotFoundException('Article not found');
    }
    if (existing.authorId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }

    let newSlug = slug;
    if (dto.title) {
      newSlug = this.generateSlug(dto.title);
    }

    let tagListUpdate = {};
    if (dto.tagList) {
      const newTags = dto.tagList.map((tag) => ({
        where: { name: tag },
        create: { name: tag },
      }));
      tagListUpdate = {
        tagList: {
          set: [],
          connectOrCreate: newTags,
        },
      };
    }

    const updated = await this.prisma.article.update({
      where: { slug },
      data: {
        title: dto.title,
        description: dto.description,
        body: dto.body,
        slug: newSlug,
        ...tagListUpdate,
      },
      include: {
        author: true,
        tagList: true,
      },
    });

    return this.buildSingleArticleResponse(updated, userId);
  }

  async delete(slug: string, userId: number) {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }
    if (article.authorId !== userId) {
      throw new ForbiddenException('Unauthorized');
    }
    await this.prisma.favoriteArticles.deleteMany({
      where: { articleId: article.id },
    });
    await this.prisma.article.delete({ where: { slug } });
    return;
  }

  async findAll(query: FilterArticlesDto, userId?: number) {
    const { tag, author, favorited } = query;
    const limit = query.limit ?? DEFAULT_TAKE;
    const offset = query.offset ?? DEFAULT_SKIP;
    const page = Math.floor(offset / limit) + 1;

    const where: any = {};

    if (tag) {
      where.tagList = {
        some: {
          name: tag,
        },
      };
    }

    if (author) {
      const authorUsers = await this.prisma.user.findMany({
        where: {
          username: {
            contains: author,
          },
        },
        select: { id: true },
      });

      const authorIds = authorUsers.map((user) => user.id);

      where.authorId = { in: authorIds };
    }

    if (favorited) {
      const favoritedUser = await this.prisma.user.findUnique({
        where: { username: favorited },
        include: { favorites: true },
      });

      const favoritedArticleIds = favoritedUser?.favorites.map(
        (fav) => fav.articleId,
      ) || [];

      where.id = { in: favoritedArticleIds };
    }

    const [articles, articlesCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          author: true,
          tagList: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.article.count({ where }),
    ]);

    const articlesWithFavorite = await Promise.all(
      articles.map((article) => this.buildSingleArticleResponse(article, userId)),
    );

    return {
      articles: articlesWithFavorite,
      articlesCount,
      page,
      limit,
    };
  }

  async feed(
  userId: number,
  query: { limit?: number; offset?: number; page?: number },
) {
  const limit = query.limit ?? DEFAULT_TAKE;   
  const offset = query.offset ?? DEFAULT_SKIP; 
  const page = Math.floor(offset / limit) + 1;

  const followings = await this.prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  if (!followings.length) {
    return {
      articles: [],
      articlesCount: 0,
      page,
      limit,
    };
  }

  const followingIds = followings.map(f => f.followingId);

  const where: any = {
    authorId: { in: followingIds },
  };

  const [articles, articlesCount] = await Promise.all([
    this.prisma.article.findMany({
      where,
      include: {
        author: true,
        tagList: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    this.prisma.article.count({ where }),
  ]);

  const articlesWithFavorite = await Promise.all(
    articles.map((article) => this.buildSingleArticleResponse(article, userId)),
  );

  return {
    articles: articlesWithFavorite,
    articlesCount,
    page,
    limit,
  };
}
  async isFollowing(userId: number, authorId: number): Promise<boolean> {
    const follow = await this.prisma.follow.findFirst({
      where: { followerId: userId, followingId: authorId },
    });
    return !!follow;
  }

  async favorite(slug: string, userId: number): Promise<FullArticle> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tagList: true,
      },
    });

    if (!article) throw new NotFoundException('Article not found');

    await this.prisma.favoriteArticles.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId: article.id,
        },
      },
      create: {
        userId,
        articleId: article.id,
      },
      update: {},
    });

    return this.buildSingleArticleResponse(article, userId);
  }

  async unfavorite(slug: string, userId: number): Promise<FullArticle> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        tagList: true,
      },
    });

    if (!article) throw new NotFoundException('Article not found');

    await this.prisma.favoriteArticles.deleteMany({
      where: {
        userId,
        articleId: article.id,
      },
    });

    return this.buildSingleArticleResponse(article, userId);
  }
  
  
}
