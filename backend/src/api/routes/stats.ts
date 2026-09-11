import { Router, Request, Response, NextFunction } from 'express';
import { UserAgentRepository } from '../../database/repositories/userAgentRepository.js';
import { SourceRepository } from '../../database/repositories/sourceRepository.js';

export const statsRouter = Router();
const uaRepo = new UserAgentRepository();
const sourceRepo = new SourceRepository();

statsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboardStats = await uaRepo.getDashboardStats();
    const sources = await sourceRepo.getAllSources();
    const recentSyncRuns = await sourceRepo.getRecentSyncRuns(5);

    res.json({
      data: {
        stats: dashboardStats,
        sources: sources.map((s) => ({
          id: s.id,
          name: s.name,
          status: s.status,
          enabled: s.enabled,
          lastSync: s.last_successful_sync,
          recordCount: s.record_count,
        })),
        recentSyncRuns,
      },
      meta: {
        requestId: req.requestId || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});
