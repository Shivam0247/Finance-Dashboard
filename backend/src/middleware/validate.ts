import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validate = (schema: AnyZodObject): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                return res.status(400).json({
                    message: 'Validation failed',
                    errors,
                });
            }
            next(new AppError('Internal server error during validation', 500));
        }
    };
};
