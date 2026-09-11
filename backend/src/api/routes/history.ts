import { Router, Request, Response, NextFunction } from 'express';
import { HistoryRepository } from '../../database/repositories/historyRepository.js';

export const historyRouter = Router();
const historyRepo = new HistoryRepository();

historyRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(100, parseInt((req.query.limit as string) || '30', 10));
    const items = await historyRepo.getRecentHistory(limit);

    res.json({
      data: items,
      meta: {
        requestId: req.requestId || '',
        count: items.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});
