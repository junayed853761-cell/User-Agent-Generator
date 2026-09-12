import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

import { config } from './backend/src/config/environment.js';
import { logger } from './backend/src/utils/logger.js';
import { getDatabase } from './backend/src/database/db.js';
import { rateLimiter } from './backend/src/middleware/rateLimit.js';
import { errorHandler } from './backend/src/middleware/errorHandler.js';
import { optionalAuth } from './backend/src/middleware/auth.js';

import { healthRouter } from './backend/src/api/routes/health.js';
import { statsRouter } from './backend/src/api/routes/stats.js';
import { userAgentsRouter } from './backend/src/api/routes/userAgents.js';
import { generateRouter } from './backend/src/api/routes/generate.js';
import { analyzeRouter } from './backend/src/api/routes/analyze.js';
import { sourcesRouter } from './backend/src/api/routes/sources.js';
import { historyRouter } from './backend/src/api/routes/history.js';
import { databaseRouter } from './backend/src/api/routes/database.js';
import { defaultSourceSyncJob } from './backend/src/jobs/sourceSyncJob.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  try {
    await getDatabase();
  } catch (dbErr) {
    logger.error('Failed to initialize database on startup', dbErr);
  }

  // Start Automated Daily Background Sync Worker
  defaultSourceSyncJob.start().catch((err) => {
    logger.error('SourceSyncJob failed to start', err);
  });

  // Base Middlewares
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request ID & Structured Logging Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const startTime = Date.now();
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      // Skip logging asset requests in dev
      if (req.path.startsWith('/api')) {
        logger.info(`${req.method} ${req.path} ${res.statusCode} in ${durationMs}ms`, {
          requestId,
          endpoint: req.path,
          method: req.method,
          status: res.statusCode,
          durationMs,
        });
      }
    });
    next();
  });

  // Apply Auth and Rate Limiting
  app.use('/api', optionalAuth);
  app.use('/api', rateLimiter());

  // Versioned API v1 routes
  const apiV1Router = express.Router();
  apiV1Router.use('/health', healthRouter);
  apiV1Router.use('/stats', statsRouter);
  apiV1Router.use('/user-agents', userAgentsRouter);
  apiV1Router.use('/generate', generateRouter);
  apiV1Router.use('/analyze', analyzeRouter);
  apiV1Router.use('/sources', sourcesRouter);
  apiV1Router.use('/history', historyRouter);
  apiV1Router.use('/database', databaseRouter);

  app.use('/api/v1', apiV1Router);
  // Backwards compatibility alias for /api/...
  app.use('/api', apiV1Router);

  // Centralized Error Handling for API routes
  app.use('/api', errorHandler);

  // Vite middleware for development / static serving in production
  if (config.env !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`UAForge Server running on http://0.0.0.0:${PORT} [${config.env}]`);
  });
}

startServer().catch((error) => {
  logger.error('Fatal error starting server', error);
  process.exit(1);
});
