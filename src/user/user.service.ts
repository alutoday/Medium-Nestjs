import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserById(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User is not found');

    return this.excludePrivateInfo(user);
  }

  async updateUser(userId: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
    });

    return this.excludePrivateInfo(updated);
  }

  private excludePrivateInfo(user: User) {
    const { id, password, createdAt, updatedAt, ...rest } = user;
    return rest;
  }
  
}