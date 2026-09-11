import { getDatabase } from '../db.js';

export interface SourceRecord {
  id: string;
  name: string;
  provider_type: string;
  base_url: string;
  enabled: boolean;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  last_successful_sync: string | null;
  last_attempted_sync: string | null;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface SyncRunRecord {
  id: number;
  source_id: string;
  status: 'SUCCESS' | 'FAILED' | 'DEGRADED' | 'RUNNING';
  records_fetched: number;
  records_inserted: number;
  records_updated: number;
  error_message: string | null;
  duration_ms: number;
  started_at: string;
  completed_at: string | null;
}

export class SourceRepository {
  async getAllSources(): Promise<SourceRecord[]> {
    const db = await getDatabase();
    const res = await db.query<SourceRecord>(
      'SELECT * FROM sources ORDER BY id ASC'
    );
    return res.rows;
  }

  async getSourceById(id: string): Promise<SourceRecord | null> {
    const db = await getDatabase();
    const res = await db.query<SourceRecord>(
      'SELECT * FROM sources WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  }

  async updateSourceToggle(id: string, enabled: boolean): Promise<SourceRecord | null> {
    const db = await getDatabase();
    const res = await db.query<SourceRecord>(
      `UPDATE sources
       SET enabled = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [enabled, id]
    );
    return res.rows[0] || null;
  }

  async updateSourceSyncStatus(
    id: string,
    data: {
      status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
      recordCount?: number;
      isSuccess: boolean;
    }
  ): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    if (data.isSuccess) {
      await db.query(
        `UPDATE sources
         SET status = $1,
             last_successful_sync = $2,
             last_attempted_sync = $2,
             record_count = COALESCE($3, record_count),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [data.status, now, data.recordCount, id]
      );
    } else {
      await db.query(
        `UPDATE sources
         SET status = $1,
             last_attempted_sync = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [data.status, now, id]
      );
    }
  }

  async startSyncRun(sourceId: string): Promise<number> {
    const db = await getDatabase();
    const res = await db.query<{ id: number }>(
      `INSERT INTO sync_runs (source_id, status, started_at)
       VALUES ($1, 'RUNNING', CURRENT_TIMESTAMP)
       RETURNING id`,
      [sourceId]
    );
    return res.rows[0].id;
  }

  async completeSyncRun(
    runId: number,
    data: {
      status: 'SUCCESS' | 'FAILED' | 'DEGRADED';
      recordsFetched: number;
      recordsInserted: number;
      recordsUpdated: number;
      errorMessage?: string | null;
      durationMs: number;
    }
  ): Promise<void> {
    const db = await getDatabase();
    await db.query(
      `UPDATE sync_runs
       SET status = $1,
           records_fetched = $2,
           records_inserted = $3,
           records_updated = $4,
           error_message = $5,
           duration_ms = $6,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        data.status,
        data.recordsFetched,
        data.recordsInserted,
        data.recordsUpdated,
        data.errorMessage || null,
        data.durationMs,
        runId,
      ]
    );
  }

  async getRecentSyncRuns(limit: number = 20): Promise<SyncRunRecord[]> {
    const db = await getDatabase();
    const res = await db.query<SyncRunRecord>(
      `SELECT * FROM sync_runs ORDER BY started_at DESC LIMIT $1`,
      [limit]
    );
    return res.rows;
  }
}
