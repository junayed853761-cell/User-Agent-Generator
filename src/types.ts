export interface DashboardStats {
  totalRecords: number;
  highConfidenceRecords: number;
  androidRecords: number;
  iosRecords: number;
  desktopRecords: number;
  activeSources: number;
}

export interface SourceItem {
  id: string;
  name: string;
  providerType: string;
  baseUrl: string;
  enabled: boolean;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  lastSuccessfulSync: string | null;
  lastAttemptedSync: string | null;
  recordCount: number;
  requiresApiKey: boolean;
  isConfigured: boolean;
  description: string;
}

export interface SyncRunItem {
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

export interface SchedulerStatus {
  status: 'IDLE' | 'SYNCING' | 'ERROR';
  cadence: string;
  intervalMs: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalRuns: number;
  isRunning: boolean;
  lastResults: Record<string, { fetched: number; inserted: number; status: string }> | null;
  lastError: string | null;
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

export interface GeneratedUserAgent {
  id: number;
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  country?: {
    code: string;
    name: string;
    flag: string;
  };
  confidence: {
    score: number;
    status: string;
  };
  sourcesCount: number;
  sources: string[];
}

export interface SourceMatchInfo {
  sourceId: string;
  sourceName: string;
  matched: boolean;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  note?: string;
}

export interface AnalysisResult {
  userAgent: string;
  browser: {
    name: string;
    version: string;
    major: string;
  };
  os: {
    name: string;
    version: string;
  };
  device: {
    type: string;
    brand: string;
    model: string;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
  sources: SourceMatchInfo[];
  confidence: {
    score: number;
    status: string;
    reasons: string[];
    warnings: string[];
    breakdown: {
      baseSourceScore: number;
      multiSourceBonus: number;
      compatibilityModifier: number;
      parserScore: number;
      deviceConsistencyScore: number;
      recencyBonus: number;
    };
  };
  compatibility: {
    status: string;
    isValid: boolean;
    checksPassed: string[];
    checksFailed: string[];
  };
  warnings: string[];
  isKnownInDatabase: boolean;
  whatIsMyBrowserOfficial?: {
    verified: boolean;
    softwareName?: string;
    softwareVersion?: string;
    operatingSystemName?: string;
    hardwareType?: string;
    message?: string;
    isAuthentic: boolean;
  };
}

export interface GenerationHistoryItem {
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

export interface DatabaseStatus {
  projectId: string;
  supabaseUrl: string;
  publishableKeyMasked: string;
  engine: string;
  isExternalPostgres: boolean;
  status: 'connected' | 'configured' | 'offline';
  message: string;
  totalRecords: number;
  sourcesCount: number;
  connectionGuide: {
    postgresConnectionString: string;
    supabaseDashboardUrl: string;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  version: string;
  uptimeSeconds: number;
  database: {
    status: string;
    error: string | null;
  };
  providers: {
    id: string;
    name: string;
    status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
    responseTimeMs: number;
    message?: string;
  }[];
  responseTimeMs: number;
}
