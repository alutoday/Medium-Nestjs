import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RequestUser } from 'src/auth/request-user.interface';
import { CommentEntity } from './entities/comment.entity';

@Controller('api/articles/:slug/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Param('slug') slug: string,
    @Body('comment') createCommentDto: CreateCommentDto,
    @Req() req: RequestUser & Request,
  ): Promise<{ comment: CommentEntity}> {
    const comment = await this.commentService.create(
      slug,
      req.user.sub,
      createCommentDto,
    );
    return { comment: new CommentEntity(comment) };
  }

    @Get()
  async findAll(
    @Param('slug') slug: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
  ): Promise<{ comments: CommentEntity[] }> {
    const comments = await this.commentService.findByArticleSlug(
      slug,
      +limit,
      +offset,
    );
    return {
      comments: comments.map((c) => new CommentEntity(c)),
    };
  }
  
}
