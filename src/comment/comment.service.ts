import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from '@prisma/client';

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
  
}
