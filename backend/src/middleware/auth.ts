import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { sendError } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Read token from HTTPOnly cookie or Bearer header fallback
  let token = req.cookies?.access_token;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Authentication required. Access token missing.', undefined, 401);
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return sendError(res, 'Invalid or expired access token.', undefined, 401);
  }

  req.user = payload;
  next();
}

export function requireRoles(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', undefined, 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden. Account role ${req.user.role} does not have required permissions (${roles.join(', ')}).`,
        undefined,
        403
      );
    }

    next();
  };
}
