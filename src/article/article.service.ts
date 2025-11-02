import {
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import slugify from 'slugify';


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
  
}
