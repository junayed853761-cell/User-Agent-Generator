import { getDatabase } from '../db.js';
import { hashUserAgent, normalizeUserAgent } from '../../utils/hash.js';

export interface UserAgentRecord {
  id: number;
  user_agent: string;
  normalized_hash: string;
  browser: string | null;
  browser_version: string | null;
  browser_major_version: string | null;
  operating_system: string | null;
  operating_system_version: string | null;
  device_type: string | null;
  device_brand: string | null;
  device_model: string | null;
  country_code: string | null;
  country_name: string | null;
  is_mobile: boolean;
  is_tablet: boolean;
  is_desktop: boolean;
  confidence_score: number;
  validation_status: string;
  first_seen: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  sources?: string[];
}

export interface UserAgentFilters {
  platform?: string; // 'Android', 'iOS', 'Windows', 'macOS', 'Linux'
  deviceType?: string; // 'mobile', 'tablet', 'desktop'
  browser?: string; // 'Chrome', 'Safari', 'Firefox', etc.
  country?: string; // 'US', 'USA', 'United States', 'GB', etc.
  minimumConfidence?: number;
  source?: string;
  searchQuery?: string;
  clientId?: string; // Unique client identifier for zero-duplicate enforcement
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class UserAgentRepository {
  async upsertUserAgent(
    data: {
      userAgent: string;
      browser?: string;
      browserVersion?: string;
      browserMajorVersion?: string;
      operatingSystem?: string;
      operatingSystemVersion?: string;
      deviceType?: string;
      deviceBrand?: string;
      deviceModel?: string;
      countryCode?: string;
      countryName?: string;
      isMobile?: boolean;
      isTablet?: boolean;
      isDesktop?: boolean;
      confidenceScore?: number;
      validationStatus?: string;
    },
    sourceId: string,
    sourceRecordId?: string
  ): Promise<{ id: number; isNew: boolean }> {
    const db = await getDatabase();
    const normalized = normalizeUserAgent(data.userAgent);
    const hash = hashUserAgent(normalized);

    // 1. Check existing record
    const existing = await db.query<UserAgentRecord>(
      'SELECT id, confidence_score, country_code, country_name FROM user_agents WHERE normalized_hash = $1',
      [hash]
    );

    let uaId: number;
    let isNew = false;

    if (existing.rows.length > 0) {
      uaId = existing.rows[0].id;
      // Update last_seen, country if newly provided, and potentially confidence if improved
      await db.query(
        `UPDATE user_agents SET
          last_seen = CURRENT_TIMESTAMP,
          confidence_score = GREATEST(confidence_score, $1),
          country_code = COALESCE($2, country_code),
          country_name = COALESCE($3, country_name),
          validation_status = COALESCE($4, validation_status),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          data.confidenceScore || existing.rows[0].confidence_score,
          data.countryCode || null,
          data.countryName || null,
          data.validationStatus,
          uaId,
        ]
      );
    } else {
      isNew = true;
      const insertRes = await db.query<{ id: number }>(
        `INSERT INTO user_agents (
          user_agent, normalized_hash, browser, browser_version, browser_major_version,
          operating_system, operating_system_version, device_type, device_brand, device_model,
          country_code, country_name, is_mobile, is_tablet, is_desktop, confidence_score, validation_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING id`,
        [
          normalized,
          hash,
          data.browser || null,
          data.browserVersion || null,
          data.browserMajorVersion || null,
          data.operatingSystem || null,
          data.operatingSystemVersion || null,
          data.deviceType || 'desktop',
          data.deviceBrand || null,
          data.deviceModel || null,
          data.countryCode || 'US',
          data.countryName || 'United States',
          data.isMobile ?? false,
          data.isTablet ?? false,
          data.isDesktop ?? true,
          data.confidenceScore ?? 0,
          data.validationStatus ?? 'Validated',
        ]
      );
      uaId = insertRes.rows[0].id;
    }

    // 2. Link with source in user_agent_sources
    if (sourceId) {
      await db.query(
        `INSERT INTO user_agent_sources (user_agent_id, source_id, source_record_id, last_seen, matched_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_agent_id, source_id)
         DO UPDATE SET
           last_seen = CURRENT_TIMESTAMP,
           matched_at = CURRENT_TIMESTAMP`,
        [uaId, sourceId, sourceRecordId || null]
      );
    }

    return { id: uaId, isNew };
  }

  async findByHash(hash: string): Promise<UserAgentRecord | null> {
    const db = await getDatabase();
    const res = await db.query<UserAgentRecord>(
      'SELECT * FROM user_agents WHERE normalized_hash = $1',
      [hash]
    );
    if (res.rows.length === 0) return null;
    const record = res.rows[0];
    record.sources = await this.getSourcesForUserAgent(record.id);
    return record;
  }

  async findByUserAgent(ua: string): Promise<UserAgentRecord | null> {
    const hash = hashUserAgent(ua);
    return this.findByHash(hash);
  }

  async findById(id: number): Promise<UserAgentRecord | null> {
    const db = await getDatabase();
    const res = await db.query<UserAgentRecord>(
      'SELECT * FROM user_agents WHERE id = $1',
      [id]
    );
    if (res.rows.length === 0) return null;
    const record = res.rows[0];
    record.sources = await this.getSourcesForUserAgent(record.id);
    return record;
  }

  async getSourcesForUserAgent(uaId: number): Promise<string[]> {
    const db = await getDatabase();
    const res = await db.query<{ source_id: string }>(
      'SELECT source_id FROM user_agent_sources WHERE user_agent_id = $1',
      [uaId]
    );
    return res.rows.map((r) => r.source_id);
  }

  async getRandomValidatedRecords(
    filters: UserAgentFilters,
    limit: number = 10
  ): Promise<UserAgentRecord[]> {
    const db = await getDatabase();
    const { conditions, params } = this.buildFilterConditions(filters);

    params.push(limit);
    const sql = `
      SELECT * FROM user_agents
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
      ORDER BY 
        CASE WHEN confidence_score >= 90 THEN 0 ELSE 1 END,
        confidence_score DESC,
        RANDOM()
      LIMIT $${params.length}
    `;

    const res = await db.query<UserAgentRecord>(sql, params);
    for (const row of res.rows) {
      row.sources = await this.getSourcesForUserAgent(row.id);
    }

    // Zero-Duplicate Guarantee: Mark delivered user-agents as served so they are never served again
    if (filters.clientId && res.rows.length > 0) {
      await this.markRecordsAsServed(
        filters.clientId,
        res.rows.map((r) => r.id)
      );
    }

    return res.rows;
  }

  async searchUserAgents(
    filters: UserAgentFilters,
    pagination: PaginationOptions = {}
  ): Promise<{ records: UserAgentRecord[]; total: number; page: number; totalPages: number }> {
    const db = await getDatabase();
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, Math.max(1, pagination.limit || 20));
    const offset = (page - 1) * limit;

    const { conditions, params } = this.buildFilterConditions(filters);
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Count query
    const countSql = `SELECT COUNT(*) as total FROM user_agents ${whereClause}`;
    const countRes = await db.query<{ total: string | number }>(countSql, params);
    const total = parseInt(String(countRes.rows[0]?.total || 0), 10);

    // Records query
    const queryParams = [...params, limit, offset];
    const recordsSql = `
      SELECT * FROM user_agents
      ${whereClause}
      ORDER BY confidence_score DESC, last_seen DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;
    const res = await db.query<UserAgentRecord>(recordsSql, queryParams);

    for (const row of res.rows) {
      row.sources = await this.getSourcesForUserAgent(row.id);
    }

    return {
      records: res.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  private buildFilterConditions(filters: UserAgentFilters): { conditions: string[]; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.platform && filters.platform.toLowerCase() !== 'all') {
      params.push(`%${filters.platform}%`);
      conditions.push(`operating_system ILIKE $${params.length}`);
    }

    if (filters.browser && filters.browser.toLowerCase() !== 'all') {
      params.push(`%${filters.browser}%`);
      conditions.push(`browser ILIKE $${params.length}`);
    }

    if (filters.deviceType && filters.deviceType.toLowerCase() !== 'all') {
      params.push(filters.deviceType.toLowerCase());
      conditions.push(`LOWER(device_type) = $${params.length}`);
    }

    if (filters.country && filters.country.toLowerCase() !== 'all') {
      const c = filters.country.trim();
      params.push(c.toUpperCase());
      params.push(`%${c}%`);
      conditions.push(`(country_code = $${params.length - 1} OR country_name ILIKE $${params.length} OR user_agent ILIKE $${params.length})`);
    }

    if (filters.minimumConfidence !== undefined && filters.minimumConfidence > 0) {
      params.push(filters.minimumConfidence);
      conditions.push(`confidence_score >= $${params.length}`);
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      params.push(`%${filters.searchQuery.trim()}%`);
      conditions.push(`user_agent ILIKE $${params.length}`);
    }

    if (filters.source && filters.source.toLowerCase() !== 'all') {
      params.push(filters.source.toLowerCase());
      conditions.push(`id IN (SELECT user_agent_id FROM user_agent_sources WHERE LOWER(source_id) = $${params.length})`);
    }

    // Zero-Duplicate Guarantee: strictly exclude any User-Agent already served to this client
    if (filters.clientId && filters.clientId.trim()) {
      params.push(filters.clientId.trim());
      conditions.push(
        `id NOT IN (SELECT user_agent_id FROM served_user_agents WHERE client_id = $${params.length})`
      );
    }

    return { conditions, params };
  }

  async markRecordsAsServed(clientId: string, uaIds: number[]): Promise<void> {
    if (!clientId || uaIds.length === 0) return;
    const db = await getDatabase();
    for (const id of uaIds) {
      await db.query(
        'INSERT INTO served_user_agents (client_id, user_agent_id) VALUES ($1, $2) ON CONFLICT (client_id, user_agent_id) DO NOTHING',
        [clientId, id]
      );
    }
  }

  async getServedCount(clientId: string): Promise<number> {
    if (!clientId) return 0;
    const db = await getDatabase();
    const res = await db.query<{ count: string | number }>(
      'SELECT COUNT(*) as count FROM served_user_agents WHERE client_id = $1',
      [clientId]
    );
    return parseInt(String(res.rows[0]?.count || '0'), 10);
  }

  async resetServedRecords(clientId: string): Promise<number> {
    if (!clientId) return 0;
    const db = await getDatabase();
    const res = await db.query(
      'DELETE FROM served_user_agents WHERE client_id = $1',
      [clientId]
    );
    return (res as any).rowCount || (res as any).affectedRows || 0;
  }

  async getDashboardStats() {
    const db = await getDatabase();
    const totalRes = await db.query<{ count: string }>('SELECT COUNT(*) as count FROM user_agents');
    const highConfRes = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM user_agents WHERE confidence_score >= 75'
    );
    const androidRes = await db.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM user_agents WHERE operating_system ILIKE '%Android%'"
    );
    const iosRes = await db.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM user_agents WHERE operating_system ILIKE '%iOS%'"
    );
    const desktopRes = await db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM user_agents WHERE is_desktop = true'
    );
    const activeSourcesRes = await db.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM sources WHERE enabled = true AND status = 'ONLINE'"
    );

    return {
      totalRecords: parseInt(totalRes.rows[0]?.count || '0', 10),
      highConfidenceRecords: parseInt(highConfRes.rows[0]?.count || '0', 10),
      androidRecords: parseInt(androidRes.rows[0]?.count || '0', 10),
      iosRecords: parseInt(iosRes.rows[0]?.count || '0', 10),
      desktopRecords: parseInt(desktopRes.rows[0]?.count || '0', 10),
      activeSources: parseInt(activeSourcesRes.rows[0]?.count || '0', 10),
    };
  }

  async backfillCountries(): Promise<number> {
    const db = await getDatabase();
    const records = await db.query<{ id: number; user_agent: string }>(
      'SELECT id, user_agent FROM user_agents WHERE country_code IS NULL OR country_code = \'\' OR country_name IS NULL'
    );

    const { detectCountry } = await import('../../utils/countryDetector.js');
    let updated = 0;
    for (const r of records.rows) {
      const country = detectCountry(r.user_agent);
      await db.query(
        'UPDATE user_agents SET country_code = $1, country_name = $2 WHERE id = $3',
        [country.code, country.name, r.id]
      );
      updated++;
    }
    return updated;
  }
}
