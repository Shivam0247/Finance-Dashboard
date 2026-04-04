import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../controllers/UserService';
import { authenticate } from '../middleware/authenticate';
import { requireRoles } from '../middleware/requireRoles';
import { validate } from '../middleware/validate';
import { updateRoleSchema, updateStatusSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);
router.use(requireRoles('admin'));

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await UserService.findAll();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

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
