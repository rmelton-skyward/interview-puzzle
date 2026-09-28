import type { NextFunction, Request, Response } from 'express';
import { environment } from '../config/environment.js';
import { AppError } from '../errors.js';

/** Protects venue administration when ADMIN_TOKEN is configured; local development stays frictionless otherwise. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const expectedToken = environment.ADMIN_TOKEN;
  if (!expectedToken) {
    next();
    return;
  }

  const suppliedToken = req.header('x-admin-token') ?? req.header('authorization')?.replace(/^Bearer\s+/i, '');
  if (suppliedToken !== expectedToken) {
    next(new AppError('Admin authorization required', 401, 'UNAUTHORIZED'));
    return;
  }

  next();
}