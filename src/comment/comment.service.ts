import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from '@prisma/client';
import { DEFAULT_SKIP, DEFAULT_TAKE } from 'src/common/pagination.constants';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  async create(
    slug: string,
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<Comment> {
    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article) throw new NotFoundException('Article not found');

    const comment = await this.prisma.comment.create({
      data: {
        body: createCommentDto.body,
        authorId: userId,
        articleId: article.id,
      },
      include: {
        author: true,
      },
    });

    return comment;
  }

  async findByArticleSlug(
    slug: string,
    take = DEFAULT_TAKE,
    skip = DEFAULT_SKIP,
  ): Promise<Comment[]> {
    const article = await this.prisma.article.findUnique({
      where: { slug },
    });
    if (!article) throw new NotFoundException('Article not found');

    const comments = await this.prisma.comment.findMany({
      where: { articleId: article.id },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });

    return comments;
  }

  async delete(slug: string, commentId: number, userId: number) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const article = await this.prisma.article.findUnique({ where: { slug } });
    if (!article || comment.articleId !== article.id)
      throw new NotFoundException('Comment does not belong to article');

    if (comment.authorId !== userId)
      throw new ForbiddenException('Not allowed to delete this comment');

    await this.prisma.comment.delete({ where: { id: commentId } });
  } 
}

