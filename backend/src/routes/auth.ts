import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../controllers/AuthService';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/schemas';

const router = Router();

router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
