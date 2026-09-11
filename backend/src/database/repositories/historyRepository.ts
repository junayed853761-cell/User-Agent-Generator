import { getDatabase } from '../db.js';

export interface GenerationHistoryRecord {
  id: number;
  user_id: number | null;
  platform: string;
  device_type: string;
  browser: string;
  min_confidence: number;
  quantity: number;
  result_count: number;
  exported_format: string | null;
  generated_at: string;
}

export class HistoryRepository {
  async recordGeneration(data: {
    userId?: number | null;
    platform: string;
    deviceType: string;
    browser: string;
    minConfidence: number;
    quantity: number;
    resultCount: number;
    exportedFormat?: string | null;
  }): Promise<number> {
    const db = await getDatabase();
    const res = await db.query<{ id: number }>(
      `INSERT INTO generation_history (
        user_id, platform, device_type, browser, min_confidence, quantity, result_count, exported_format
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        data.userId || null,
        data.platform,
        data.deviceType,
        data.browser,
        data.minConfidence,
        data.quantity,
        data.resultCount,
        data.exportedFormat || null,
      ]
    );
    return res.rows[0].id;
  }

  async getRecentHistory(limit: number = 30): Promise<GenerationHistoryRecord[]> {
    const db = await getDatabase();
    const res = await db.query<GenerationHistoryRecord>(
      `SELECT * FROM generation_history ORDER BY generated_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}
