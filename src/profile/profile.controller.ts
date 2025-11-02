import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import {JwtAuthGuardDetect } from 'src/auth/auth.guard.detect';
import { ProfileService } from './profile.service';
import { ProfileEntity } from './entities/profile.entity';
import { JwtAuthGuard } from 'src/auth/auth.guard';

@Controller('api/profiles')
export class ProfileController {
  constructor(private service: ProfileService) {}

  @Get(':username')
  @UseGuards(JwtAuthGuardDetect)
  async get(@Param('username') username: string, @Req() req: any) {
    const userId: number | undefined = req?.user?.sub;
    const data = await this.service.getProfile(username, userId);
    return new ProfileEntity(data);
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  async follow(@Param('username') username: string, @Req() req: any) {
    const data = await this.service.follow(username, req.user.sub);
    return new ProfileEntity(data);
  }

 
}
