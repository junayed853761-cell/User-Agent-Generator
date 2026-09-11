import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserAgentService } from '../../services/userAgentService.js';

export const userAgentsRouter = Router();
const uaService = new UserAgentService();

const searchSchema = z.object({
  platform: z.string().optional(),
  deviceType: z.string().optional(),
  browser: z.string().optional(),
  country: z.string().optional(),
  minimumConfidence: z.coerce.number().min(0).max(100).optional(),
  source: z.string().optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

userAgentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = searchSchema.parse(req.query);
    const result = await uaService.search(
      {
        platform: query.platform,
        deviceType: query.deviceType,
        browser: query.browser,
        country: query.country,
        minimumConfidence: query.minimumConfidence,
        source: query.source,
        searchQuery: query.q,
      },
      {
        page: query.page,
        limit: query.limit,
      }
    );

    res.json({
      data: result.records,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: query.limit,
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

userAgentsRouter.get('/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const format = (req.query.format as 'json' | 'csv' | 'txt') || 'json';
    const limit = Math.min(1000, parseInt((req.query.limit as string) || '100', 10));

    const clientId =
      (req.query.clientId as string) ||
      (req.headers['x-client-id'] as string) ||
      (req.user?.id ? `user_${req.user.id}` : undefined);

    const exportResult = await uaService.exportRecords(
      {
        platform: req.query.platform as string,
        browser: req.query.browser as string,
        deviceType: req.query.deviceType as string,
        country: req.query.country as string,
        minimumConfidence: req.query.minimumConfidence ? Number(req.query.minimumConfidence) : undefined,
        source: req.query.source as string,
        clientId,
      },
      format,
      limit
    );

    res.setHeader('Content-Type', exportResult.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.send(exportResult.data);
  } catch (error) {
    next(error);
  }
});

userAgentsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'ID must be an integer' } });
    }

    const record = await uaService.getById(id);
    if (!record) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User-Agent record not found' } });
    }

    res.json({
      data: record,
      meta: {
        requestId: req.requestId || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});
