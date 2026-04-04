import { Router, Request, Response, NextFunction } from 'express';
import { TransactionService } from '../controllers/TransactionService';
import { authenticate } from '../middleware/authenticate';
import { requireRoles } from '../middleware/requireRoles';
import { validate } from '../middleware/validate';
import { transactionSchema, transactionQuerySchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireRoles('admin', 'analyst', 'viewer'),
  validate(transactionQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await TransactionService.findAll(req.query as any);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  requireRoles('admin', 'analyst'),
  validate(transactionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await TransactionService.create(req.user!.id, req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  requireRoles('admin', 'analyst'),
  validate(transactionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await TransactionService.update(req.params.id as string, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  requireRoles('admin', 'analyst'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await TransactionService.softDelete(req.params.id as string);
      res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
