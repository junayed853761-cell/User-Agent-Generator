import { Router, Request, Response } from 'express';
import { getDatabase } from '../../database/db.js';
import { getAllProviders } from '../../providers/index.js';

export const healthRouter = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbError: string | null = null;

  try {
    const db = await getDatabase();
    await db.query('SELECT 1 as health_check');
  } catch (err: any) {
    dbStatus = 'unhealthy';
    dbError = err?.message || 'Database connection error';
  }

  const providers = getAllProviders();
  const providerHealths = await Promise.allSettled(
    providers.map(async (p) => {
      const h = await p.healthCheck();
      return { id: p.getMetadata().id, name: p.name, ...h };
    })
  );

  const providerStatuses = providerHealths.map((p, idx) => {
    if (p.status === 'fulfilled') return p.value;
    return {
      id: providers[idx].getMetadata().id,
      name: providers[idx].name,
      status: 'DEGRADED',
      responseTimeMs: 0,
      message: 'Health probe threw exception',
    };
  });

  const duration = Date.now() - startTime;
  const isHealthy = dbStatus === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      error: dbError,
    },
    providers: providerStatuses,
    responseTimeMs: duration,
    meta: {
      requestId: req.requestId || '',
      timestamp: new Date().toISOString(),
    },
  });
});
