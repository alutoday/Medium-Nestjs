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
import { FilterArticlesDto } from './dto/filter-article.dto';
import { ListArticlesEntity } from './entities/list-articles.entity';


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

  @UseGuards(JwtAuthGuardDetect)
  @Get()
  async findAll(@Query() query: FilterArticlesDto, @Req() req: RequestUser & Request) {
    const userId = req.user?.sub;
    const result = await this.articleService.findAll(query, userId);
    return new ListArticlesEntity(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async getFeed(@Query() query: { limit?: number; offset?: number }, @Req() req: RequestUser & Request) {
    const userId = req.user?.sub;
    const result = await this.articleService.feed(userId, query);
    return new ListArticlesEntity(result);
  }
  
  @UseGuards(JwtAuthGuard)
  @Post(':slug/favorite')
  async favorite(@Param('slug') slug: string, @Req() req: RequestUser & Request) {
    const article = await this.articleService.favorite(slug, req.user.sub);
    return new ArticleEntity(article);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':slug/favorite')
  async unfavorite(@Param('slug') slug: string, @Req() req: RequestUser & Request) {
    const article = await this.articleService.unfavorite(slug, req.user.sub);
    return new ArticleEntity(article);
  }
}
