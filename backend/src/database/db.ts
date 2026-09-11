import pg from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { DDL_STATEMENTS } from './schema/schema.js';
import { providerConfigs } from '../config/providers.js';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
  close(): Promise<void>;
}

let dbInstance: DatabaseClient | null = null;

class PgPoolClient implements DatabaseClient {
  private pool: pg.Pool;

  constructor(connectionString: string) {
    this.pool = new pg.Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle pg client', err);
    });
  }

  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    const res = await this.pool.query(text, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount ?? res.rows.length,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class PGliteClient implements DatabaseClient {
  private pglite: PGlite;

  constructor(pglite: PGlite) {
    this.pglite = pglite;
  }

  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    const res = await this.pglite.query(text, params);
    return {
      rows: res.rows as T[],
      rowCount: (res as any).affectedRows ?? res.rows.length,
    };
  }

  async close(): Promise<void> {
    await this.pglite.close();
  }
}

export let currentDatabaseEngine: 'Supabase PostgreSQL' | 'Embedded PostgreSQL (PGlite)' = 'Embedded PostgreSQL (PGlite)';

export async function getDatabase(): Promise<DatabaseClient> {
  if (dbInstance) {
    return dbInstance;
  }

  if (config.databaseUrl && config.databaseUrl.startsWith('postgres')) {
    logger.info('Attempting PostgreSQL connection pool via DATABASE_URL');
    try {
      const pgClient = new PgPoolClient(config.databaseUrl);
      // Verify connectivity
      await pgClient.query('SELECT 1');
      dbInstance = pgClient;
      currentDatabaseEngine = 'Supabase PostgreSQL';
      logger.info('External PostgreSQL database connected successfully');
    } catch (pgErr) {
      logger.warn('Failed to connect to external PostgreSQL DATABASE_URL. Falling back to embedded PGlite engine.', pgErr);
      const dataDir = path.resolve(process.cwd(), 'data', 'pgdata');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const pglite = new PGlite(dataDir);
      dbInstance = new PGliteClient(pglite);
      currentDatabaseEngine = 'Embedded PostgreSQL (PGlite)';
    }
  } else {
    logger.info('Initializing embedded PostgreSQL (PGlite) engine');
    const dataDir = path.resolve(process.cwd(), 'data', 'pgdata');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const pglite = new PGlite(dataDir);
    dbInstance = new PGliteClient(pglite);
    currentDatabaseEngine = 'Embedded PostgreSQL (PGlite)';
  }

  await initDatabase(dbInstance);
  return dbInstance;
}

export async function initDatabase(client: DatabaseClient): Promise<void> {
  try {
    // 1. Run core DDL statements with individual error isolation
    for (const statement of DDL_STATEMENTS) {
      try {
        await client.query(statement);
      } catch (stmtErr: any) {
        logger.debug('DDL statement note (already applied or info): ' + (stmtErr?.message || stmtErr));
      }
    }

    // 2. Run backwards-compatible column migrations for existing tables
    const columnMigrations = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS jwt_secret VARCHAR(128);`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'US';`,
      `ALTER TABLE user_agents ADD COLUMN IF NOT EXISTS country_name VARCHAR(100) DEFAULT 'United States';`,
      `CREATE INDEX IF NOT EXISTS idx_user_agents_country ON user_agents(country_code);`,
      `UPDATE user_agents SET country_code = 'US', country_name = 'United States' WHERE country_code IS NULL OR country_code = '';`,
    ];

    for (const migration of columnMigrations) {
      try {
        await client.query(migration);
      } catch (migErr: any) {
        logger.debug('Column migration notice: ' + (migErr?.message || migErr));
      }
    }

    logger.info('PostgreSQL schema initialized and verified successfully');

    // Seed default providers in sources table if not present
    for (const provider of Object.values(providerConfigs)) {
      await client.query(
        `INSERT INTO sources (id, name, provider_type, base_url, enabled, status, record_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           base_url = EXCLUDED.base_url,
           updated_at = CURRENT_TIMESTAMP`,
        [
          provider.id,
          provider.name,
          provider.providerType,
          provider.baseUrl,
          provider.enabled,
          'ONLINE',
          0,
        ]
      );
    }

    // Seed default authenticated database users if not present or missing password
    const adminPassHash = await bcrypt.hash('admin12345', 10);
    const devPassHash = await bcrypt.hash('dev12345', 10);
    const adminSecret = crypto.randomBytes(32).toString('hex');
    const devSecret = crypto.randomBytes(32).toString('hex');

    await client.query(
      `INSERT INTO users (email, role, password_hash, jwt_secret, api_key)
       VALUES ($1, 'admin', $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET
         role = 'admin',
         password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash),
         jwt_secret = COALESCE(users.jwt_secret, EXCLUDED.jwt_secret)`,
      ['admin@uaforge.local', adminPassHash, adminSecret, 'uaf_admin_key_prod']
    );

    await client.query(
      `INSERT INTO users (email, role, password_hash, jwt_secret, api_key)
       VALUES ($1, 'user', $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = COALESCE(users.password_hash, EXCLUDED.password_hash),
         jwt_secret = COALESCE(users.jwt_secret, EXCLUDED.jwt_secret)`,
      ['developer@uaforge.local', devPassHash, devSecret, 'uaf_dev_key_prod']
    );

    logger.info('Database JWT users seeded and ready');
  } catch (error) {
    logger.error('Failed to initialize database schema', error);
    throw error;
  }
}
