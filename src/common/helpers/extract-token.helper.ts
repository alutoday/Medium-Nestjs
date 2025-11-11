import { Request } from 'express';

export function extractAuthToken(req: Request): string {
  const raw = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
  if (!raw) return '';
  const [scheme, ...rest] = raw.trim().split(/\s+/);
  const token = rest.join(' ');
  const s = scheme?.toLowerCase();
  return (s === 'bearer' || s === 'token' || s === 'jwt') && token ? token : '';
}
