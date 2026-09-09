import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('[Error Handler]', err);

  const message = err.message || 'Internal Server Error';
  const statusCode = err.statusCode || 500;

  return sendError(
    res,
    message,
    err.errors || { server: [message] },
    statusCode
  );
}
