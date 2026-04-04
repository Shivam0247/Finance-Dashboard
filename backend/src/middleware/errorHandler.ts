import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      message: err.message
    });
  }

  const status = (err as any).status || 500;
  const message = err.message || 'Internal server error';

  const response: { message: string; errors?: string[] } = { message };

  if ((err as any).errors) {
    response.errors = (err as any).errors;
  }

  res.status(status).json(response);
};
