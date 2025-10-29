import { Controller, Get, Put, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import type { RequestUser } from 'src/auth/request-user.interface';

function extractAuthToken(req: Request): string {
  const raw = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
  if (!raw) return '';
  const [scheme, ...rest] = raw.trim().split(/\s+/);
  const token = rest.join(' ');
  const s = scheme?.toLowerCase();
  return (s === 'bearer' || s === 'token' || s === 'jwt') && token ? token : '';
}
function toUserResponse(user: {
  email?: string | null;
  username?: string | null;
  bio?: string | null;
  image?: string | null;
}, token: string) {
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

@Controller('api/user')
export class UserController {
    constructor(private readonly userService: UserService) {}  

  @UseGuards(JwtAuthGuard)
  @Get()
  async getCurrentUser(@Req() req: RequestUser & Request) {
    const token = extractAuthToken(req);
    const user = await this.userService.getUserById(req.user.sub);
    if (!user) {
      throw new NotFoundException('User is not found');
    }
    return toUserResponse(user, token);

  }
  
  @UseGuards(JwtAuthGuard)
  @Put()
  async updateUser(@Req() req: RequestUser & Request, @Body('user') updateUserDto: UpdateUserDto) {
    const token = extractAuthToken(req);
    const userId = req.user.sub;
    const userUpdated = await this.userService.updateUser(userId, updateUserDto);
    return toUserResponse(userUpdated, token);}
}
