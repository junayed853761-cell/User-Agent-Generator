import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { currentDatabaseEngine } from '../database/db.js';

export interface SupabaseStatus {
  projectId: string;
  supabaseUrl: string;
  publishableKeyMasked: string;
  engine: string;
  isExternalPostgres: boolean;
  status: 'connected' | 'configured' | 'offline';
  message: string;
  connectionGuide: {
    postgresConnectionString: string;
    supabaseDashboardUrl: string;
  };
}

class SupabaseService {
  private client: SupabaseClient | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (config.supabaseUrl && config.supabaseApiKey) {
        this.client = createClient(config.supabaseUrl, config.supabaseApiKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        this.isInitialized = true;
        logger.info('Supabase client initialized for project: ' + config.supabaseProjectId);
      }
    } catch (err) {
      logger.warn('Failed to initialize Supabase client:', err);
    }
  }

  public getClient(): SupabaseClient | null {
    return this.client;
  }

  public async getStatus(): Promise<SupabaseStatus> {
    const maskedKey = config.supabaseApiKey
      ? `${config.supabaseApiKey.substring(0, 14)}...${config.supabaseApiKey.substring(config.supabaseApiKey.length - 4)}`
      : 'not_configured';

    let clientStatus: 'connected' | 'configured' | 'offline' = 'configured';
    let message = 'Supabase client configured for project ' + config.supabaseProjectId;

    if (this.client) {
      try {
        // Ping supabase auth / health
        const { error } = await this.client.auth.getSession();
        if (!error) {
          clientStatus = 'connected';
          message = 'Successfully reached Supabase API (Project ID: ' + config.supabaseProjectId + ')';
        }
      } catch (e: any) {
        message = 'Supabase configured; network ping noted: ' + (e?.message || 'ready');
      }
    }

    return {
      projectId: config.supabaseProjectId,
      supabaseUrl: config.supabaseUrl,
      publishableKeyMasked: maskedKey,
      engine: currentDatabaseEngine,
      isExternalPostgres: currentDatabaseEngine === 'Supabase PostgreSQL',
      status: clientStatus,
      message,
      connectionGuide: {
        postgresConnectionString: `postgresql://postgres.${config.supabaseProjectId}:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`,
        supabaseDashboardUrl: `https://supabase.com/dashboard/project/${config.supabaseProjectId}`,
      },
    };
  }
}

export const supabaseService = new SupabaseService();
