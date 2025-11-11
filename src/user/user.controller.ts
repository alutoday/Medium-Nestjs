import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';
import { extractAuthToken } from 'src/common/helpers/extract-token.helper';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import type { RequestUser } from 'src/auth/request-user.interface';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrentUser(@Req() req: Request & RequestUser) {
    const token = extractAuthToken(req);
    const user = await this.userService.getMe(req.user.sub);
    return this.userService.buildUserResponse(user, token);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateUser(@Req() req: RequestUser & Request, @Body('user') updateUserDto: UpdateUserDto) {
    const token = extractAuthToken(req);
    const userId = req.user.sub;
    const userUpdated = await this.userService.updateUser(userId, updateUserDto);
    return this.userService.buildUserResponse(userUpdated, token);
  }
}

