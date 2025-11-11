import { Request } from 'express';

export interface RequestUser extends Request {
  user: {
    sub: number;
    username: string;
    email: string;
    iat?: number;
    exp?: number;
  };
}
