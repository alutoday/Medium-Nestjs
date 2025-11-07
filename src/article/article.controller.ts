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
import { UpdateArticleDto } from './dto/update-article.dto';


@Controller('api/articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body('article') dto: CreateArticleDto,
    @Req() req: RequestUser & Request
  ): Promise<ArticleEntity> {
    const article = await this.articleService.create(req.user.sub, dto);
    return new ArticleEntity(article);
  } 

  @UseGuards(JwtAuthGuardDetect)
  @Get(':slug')
  async findOne(@Param('slug') slug: string, @Req() req: RequestUser & Request): Promise<ArticleEntity> {
    const userId = req.user?.sub;
    const article = await this.articleService.findBySlug(slug, userId);
    return new ArticleEntity(article);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':slug')
  async update(
    @Param('slug') slug: string,
    @Body('article') dto: UpdateArticleDto,
    @Req() req: RequestUser & Request,
  ) {
    const article = await this.articleService.update(slug, req.user.sub, dto);
    return new ArticleEntity(article);
  }

    @UseGuards(JwtAuthGuard)
  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('slug') slug: string, @Req() req: RequestUser & Request) {
    return this.articleService.delete(slug, req.user.sub);
  }
}
