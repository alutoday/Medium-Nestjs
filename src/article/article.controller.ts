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
}
