import { Router, Request, Response, NextFunction } from 'express';
import { SourceRepository } from '../../database/repositories/sourceRepository.js';
import { SourceSyncService } from '../../services/sourceSyncService.js';
import { getAllProviders } from '../../providers/index.js';
import { defaultSourceSyncJob } from '../../jobs/sourceSyncJob.js';

export const sourcesRouter = Router();
const sourceRepo = new SourceRepository();
const syncService = new SourceSyncService();

sourcesRouter.get('/scheduler/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = defaultSourceSyncJob.getStatus();
    res.json({
      data: status,
      meta: {
        requestId: req.requestId || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

sourcesRouter.post('/scheduler/trigger', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await defaultSourceSyncJob.triggerSyncNow();
    res.json({
      data: result,
      message: 'Triggered daily source synchronization cycle',
      meta: {
        requestId: req.requestId || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

sourcesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dbSources = await sourceRepo.getAllSources();
    const providers = getAllProviders();
    const providerMetaMap = new Map(providers.map((p) => [p.getMetadata().id, p.getMetadata()]));

    const merged = dbSources.map((s) => {
      const meta = providerMetaMap.get(s.id);
      return {
        id: s.id,
        name: s.name,
        providerType: s.provider_type,
        baseUrl: s.base_url,
        enabled: s.enabled,
        status: s.status,
        lastSuccessfulSync: s.last_successful_sync,
        lastAttemptedSync: s.last_attempted_sync,
        recordCount: s.record_count,
        requiresApiKey: meta?.requiresApiKey ?? false,
        isConfigured: meta?.isConfigured ?? true,
        description: meta?.description || '',
      };
    });

    res.json({
      data: merged,
      meta: {
        requestId: req.requestId || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

sourcesRouter.get('/runs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(50, parseInt((req.query.limit as string) || '20', 10));
    const runs = await sourceRepo.getRecentSyncRuns(limit);
    res.json({
      data: runs,
      meta: {
        requestId: req.requestId || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

sourcesRouter.post('/:id/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      const result = await syncService.syncAllSources();
      return res.json({
        data: result,
        message: 'Synchronized all data sources successfully',
        meta: {
          requestId: req.requestId || '',
          timestamp: new Date().toISOString(),
        },
      });
    }

    const result = await syncService.syncSource(id);
    res.json({
      data: result,
      message: `Synchronized source '${id}'`,
      meta: {
        requestId: req.requestId || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

sourcesRouter.patch('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    const updated = await sourceRepo.updateSourceToggle(id, Boolean(enabled));

    if (!updated) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Source not found' } });
    }

    res.json({
      data: updated,
      meta: {
        requestId: req.requestId || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});
