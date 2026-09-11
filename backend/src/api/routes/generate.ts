import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GenerationService } from '../../services/generationService.js';

export const generateRouter = Router();
const generationService = new GenerationService();

const generateSchema = z.object({
  platform: z.string().optional(),
  deviceType: z.string().optional(),
  browser: z.string().optional(),
  country: z.string().optional(),
  minimumConfidence: z.coerce.number().min(0).max(100).optional().default(80),
  source: z.string().optional(),
  quantity: z.coerce.number().int().min(1).max(50).optional().default(1),
  clientId: z.string().optional(),
});

generateRouter.get('/served-stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId =
      (req.query.clientId as string) ||
      (req.headers['x-client-id'] as string) ||
      (req.user?.id ? `user_${req.user.id}` : 'default_client');
    const stats = await generationService.getServedStats(clientId);
    res.json({
      data: stats,
      meta: {
        clientId,
        zeroDuplicateActive: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

generateRouter.post('/reset-served', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId =
      (req.body.clientId as string) ||
      (req.headers['x-client-id'] as string) ||
      (req.user?.id ? `user_${req.user.id}` : 'default_client');
    const result = await generationService.resetServed(clientId);
    res.json({
      data: result,
      message: 'Zero-duplicate history cleared. All User-Agents are unserved and ready to be delivered again.',
      meta: {
        clientId,
        resetCount: result.resetCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

generateRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = generateSchema.parse(req.body);
    const clientId =
      validated.clientId ||
      (req.headers['x-client-id'] as string) ||
      (req.user?.id ? `user_${req.user.id}` : 'default_client');

    const results = await generationService.generate({
      ...validated,
      userId: req.user?.id || null,
      clientId,
    });

    const servedStats = await generationService.getServedStats(clientId);

    res.json({
      data: results,
      meta: {
        requestId: req.requestId || '',
        count: results.length,
        timestamp: new Date().toISOString(),
        zeroDuplicateActive: true,
        totalServedToYou: servedStats.servedCount,
      },
    });
  } catch (error) {
    next(error);
  }
});
