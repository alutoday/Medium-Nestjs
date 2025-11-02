import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RequestUser } from 'src/auth/request-user.interface';
import { ArticleEntity } from './entities/article.entity';
import { JwtAuthGuardDetect } from 'src/auth/auth.guard.detect';


@Controller('api/articles')
export class ArticleController {
  constructor(private readonly articlesService: ArticleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body('article') dto: CreateArticleDto,
    @Req() req: RequestUser & Request
  ): Promise<ArticleEntity> {
    const article = await this.articlesService.create(req.user.sub, dto);
    return new ArticleEntity(article);
  } 

  @UseGuards(JwtAuthGuardDetect)
  @Get(':slug')
  async findOne(@Param('slug') slug: string, @Req() req: RequestUser & Request): Promise<ArticleEntity> {
    const userId = req.user?.sub;
    const article = await this.articlesService.findBySlug(slug, userId);
    return new ArticleEntity(article);
  }
}
