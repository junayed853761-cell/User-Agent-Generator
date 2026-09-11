import { Router, Request, Response } from 'express';
import { getDatabase, initDatabase } from '../../database/db.js';
import { supabaseService } from '../../services/supabaseService.js';
import { logger } from '../../utils/logger.js';

export const databaseRouter = Router();

databaseRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    // Count records
    const countRes = await db.query('SELECT COUNT(*) as total FROM user_agents');
    const totalRecords = parseInt(countRes.rows[0]?.total || '0', 10);

    const sourcesCountRes = await db.query('SELECT COUNT(*) as total FROM sources WHERE enabled = true');
    const sourcesCount = parseInt(sourcesCountRes.rows[0]?.total || '0', 10);

    const supabaseStatus = await supabaseService.getStatus();

    res.json({
      success: true,
      data: {
        ...supabaseStatus,
        totalRecords,
        sourcesCount,
      },
    });
  } catch (error: any) {
    logger.error('Database status inspection error', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to inspect database status',
    });
  }
});

databaseRouter.post('/migrate', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    await initDatabase(db);
    res.json({
      success: true,
      message: 'Database schema and column migrations verified and executed successfully',
    });
  } catch (error: any) {
    logger.error('Database manual migration trigger error', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Database migration error',
    });
  }
});
