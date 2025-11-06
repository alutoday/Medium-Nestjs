import { AuthGuard } from '@nestjs/passport';
import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { extractAuthToken } from 'src/common/helpers/extract-token.helper';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const token = extractAuthToken(req);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }
    return super.canActivate(context);
  }
}
