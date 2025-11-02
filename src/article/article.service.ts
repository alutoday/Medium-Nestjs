import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';
import { Article, Tag, User } from '@prisma/client';
import { UpdateArticleDto } from './dto/update-article.dto';

type FullArticle = Article & {
  tagList: Tag[];
  author: User;
  favorited?: boolean;
  favoritesCount?: number;
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
    const [favorited, favoritesCount] = await Promise.all([
      userId ? this.isFavorited(userId, article.id) : false,
      this.countFavorites(article.id),
    ]);

    return { ...article, favorited, favoritesCount };
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


  
  
}
