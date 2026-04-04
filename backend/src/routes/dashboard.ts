import { Router, Request, Response, NextFunction } from 'express';
import { DashboardService } from '../controllers/DashboardService';
import { authenticate } from '../middleware/authenticate';
import { requireRoles } from '../middleware/requireRoles';

const router = Router();

router.use(authenticate);
router.use(requireRoles('admin', 'analyst', 'viewer'));

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DashboardService.getSummary();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DashboardService.getCategories();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/trends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DashboardService.getTrends();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await DashboardService.getRecent();
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
