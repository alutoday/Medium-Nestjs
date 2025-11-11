import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, ConflictException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { BCRYPT_SALT_ROUNDS } from 'src/common/constants/security.constants';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private readonly users: UserRepository) {}

  async getUserById(userId: number) {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('User is not found');
    return this.mapUserToPublic(user);
  }

  async getMe(userId: number) {
    const user = await this.getUserById(userId);
    return user;
  }

  buildUserResponse(
    user: {
      email?: string | null;
      username?: string | null;
      bio?: string | null;
      image?: string | null;
    },
    token: string,
  ) {
    return {
      user: {
        email: user.email ?? null,
        token,
        username: user.username ?? null,
        bio: user.bio ?? null,
        image: user.image ?? null,
      },
    };
  }

  async updateUser(userId: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, BCRYPT_SALT_ROUNDS);
    }

    try {
      const updated = await this.users.updateById(userId, {
        email: updateUserDto.email ?? undefined,
        username: updateUserDto.username ?? undefined,
        bio: updateUserDto.bio ?? undefined,
        image: updateUserDto.image ?? undefined,
        password: updateUserDto.password ?? undefined,
      });

      const { email, username, bio, image } = updated;
      return { email, username, bio, image };
    } catch (e) {
      this.logger.error('Update user failed', {
        userId,
        email: updateUserDto.email,
        username: updateUserDto.username,
        code: (e as any)?.code,
      });
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = (e as any)?.meta?.target as string | undefined;
        if (target?.includes('email')) throw new ConflictException('Email already taken');
        if (target?.includes('username')) throw new ConflictException('Username already taken');
        throw new ConflictException('Unique constraint violated');
      }
      throw new InternalServerErrorException('UPDATE_USER_FAILED');
    }
  }

  private mapUserToPublic(user: User) {
    const { password, createdAt, updatedAt, ...publicUser } = user;
    return publicUser;
  }  
}
