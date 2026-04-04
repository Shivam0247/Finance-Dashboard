import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../controllers/UserService';
import { authenticate } from '../middleware/authenticate';
import { requireRoles } from '../middleware/requireRoles';
import { validate } from '../middleware/validate';
import { AppError } from '../utils/AppError';
import { updateRoleSchema, updateStatusSchema, createUserSchema, updateUserSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.use(requireRoles('admin'));

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = req.query.search as string;
    const result = await UserService.findAll(search);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  validate(createUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  validate(updateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.update(req.params.id as string, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idToDelete = req.params.id as string;

      // Prevent user from deleting themselves
      if (req.user?.id === idToDelete) {
        throw new AppError('You cannot delete your own account', 400);
      }

      await UserService.delete(idToDelete);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id/role',
  validate(updateRoleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.updateRole(req.params.id as string, req.body.role);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id/status',
  validate(updateStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await UserService.updateStatus(req.params.id as string, req.body.status);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
