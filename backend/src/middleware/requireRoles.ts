import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Role } from '../utils/types';
import { AppError } from '../utils/AppError';

export const requireRoles = (...roles: Role[]): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient permissions', 403));
    }

    next();
  };
};
