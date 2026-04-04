import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err); // Server-side logging only

  const status = (err as any).status || 500;
  const message = err.message || 'Internal server error';

  const response: { message: string; errors?: string[] } = { message };

  if ((err as any).errors) {
    response.errors = (err as any).errors;
  }

  res.status(status).json(response);
};
