import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AnalysisService } from '../../services/analysisService.js';

export const analyzeRouter = Router();
const analysisService = new AnalysisService();

const analyzeSchema = z.object({
  userAgent: z.string().min(1, 'User-Agent string cannot be empty').max(2500),
  clientHints: z.object({
    secChUa: z.string().optional(),
    secChUaMobile: z.string().optional(),
    secChUaPlatform: z.string().optional(),
  }).optional(),
  hardware: z.object({
    gpuRenderer: z.string().optional(),
  }).optional(),
});

analyzeRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = analyzeSchema.parse(req.body);
    const result = await analysisService.analyze(validated.userAgent, {
      clientHints: validated.clientHints,
      hardware: validated.hardware,
    });

    res.json({
      data: result,
      meta: {
        requestId: req.requestId || '',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});
