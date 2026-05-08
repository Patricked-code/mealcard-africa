import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http.js';

type JwtPayload = { sub: string; role: string; companyId?: string; merchantId?: string; employeeId?: string };

declare global {
  namespace Express {
    interface Request { user?: JwtPayload }
  }
}

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new HttpError(401, 'Token manquant'));
  try {
    req.user = jwt.verify(header.slice(7), env.JWT_SECRET) as JwtPayload;
    next();
  } catch {
    next(new HttpError(401, 'Token invalide'));
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, 'Authentification requise'));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, 'Accès refusé'));
    next();
  };
}
