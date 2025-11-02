import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  private async isFollowing(viewerId: number | undefined, targetUserId: number) {
    if (!viewerId) return false;
    const f = await this.prisma.follow.findFirst({
      where: { followerId: viewerId, followingId: targetUserId },
      select: { id: true },
    });
    return !!f;
  }

  async getProfile(username: string, viewerId?: number) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, bio: true, image: true },
    });
    if (!user) throw new NotFoundException('Profile not found');

    const following = await this.isFollowing(viewerId, user.id);
    return { username: user.username, bio: user.bio, image: user.image, following };
  }
  
}
