import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          password: hashedPassword,
        },
      });

      return this.signToken(user.id, user.username, user.email);
    } catch (error) {
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      {
        throw new ForbiddenException('Email or username already taken');
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new ForbiddenException('Credentials incorrect');

    const isValidPassword = await bcrypt.compare(dto.password, user.password);
    if (!isValidPassword) throw new ForbiddenException('Credentials incorrect');

    const { email, username, bio, image } = user;
    const token = await this.signToken(user.id, user.username, user.email);
    const filteredUser = {
      email,
      token: token['access_token'],
      username,
      bio,
      image,
    };
    return filteredUser;
  }

  private async signToken(
    userId: number,
    username: string,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      username,
      email,
    };

    const token = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '1d',
    });

    return {
      access_token: token,
    };
  }
}
