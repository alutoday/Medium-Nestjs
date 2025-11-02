import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import {JwtAuthGuardDetect } from 'src/auth/auth.guard.detect';
import { ProfileService } from './profile.service';
import { ProfileEntity } from './entities/profile.entity';

@Controller('api/profiles')
export class ProfileController {
  constructor(private service: ProfileService) {}

  @Get(':username')
  @UseGuards(JwtAuthGuardDetect)
  async get(@Param('username') username: string, @Req() req: any) {
    const viewerId: number | undefined = req?.user?.sub;
    const data = await this.service.getProfile(username, viewerId);
    return new ProfileEntity(data);
  }
 
}
