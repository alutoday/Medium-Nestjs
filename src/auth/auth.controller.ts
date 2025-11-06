import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Controller('users')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body('user') dto: RegisterDto) {
    return this.authService.register(dto);
  }

  
  @Throttle({ default: { ttl: 60_000, limit: 5 } }) 
  @Post('login')
  login(@Body('user') dto: LoginDto) {
    return this.authService.login(dto);
  }
}
