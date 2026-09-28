import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors.js';

/** Central error handler: maps our typed AppErrors to their HTTP status, logs, and falls back to 500. */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    req.log?.warn({ err: { code: err.code, message: err.message } }, 'Request failed');
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }

  req.log?.error({ err }, 'Unhandled error');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
}
