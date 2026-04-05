import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validate = (schema: AnyZodObject): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            // Explicitly assign validated data to request
            if (parsed.body) {
                Object.assign(req.body, parsed.body);
            }
            if (parsed.query) {
                Object.assign(req.query, parsed.query);
            }
            if (parsed.params) {
                Object.assign(req.params, parsed.params);
            }

            next();
        } catch (error) {
            console.error('Validation Error Details:', error);
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
