import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  private async isFollowing(userId: number | undefined, targetUserId: number) {
    if (!userId) return false;
    const f = await this.prisma.follow.findFirst({
      where: { followerId: userId, followingId: targetUserId },
      select: { id: true },
    });
    return !!f;
  }

  async getProfile(username: string, userId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, bio: true, image: true },
    });
    if (!user) throw new NotFoundException('Profile not found');

    const following = await this.isFollowing(userId, user.id);
    return { username: user.username, bio: user.bio, image: user.image, following };
  }

   async follow(username: string, userId: number) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, bio: true, image: true },
    });
    if (!target) throw new NotFoundException('Profile not found');
    if (target.id === userId) return { ...target, following: false }; 

    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: userId, followingId: target.id } },
      create: { followerId: userId, followingId: target.id },
      update: {},
    });

    return { username: target.username, bio: target.bio, image: target.image, following: true };
  }
  
}
