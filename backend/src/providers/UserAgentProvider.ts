export interface RawUserAgent {
  userAgent: string;
  sourceRecordId?: string;
  weight?: number;
  metadata?: Record<string, any>;
}

export interface ProviderHealth {
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  responseTimeMs: number;
  message?: string;
}

export interface ProviderMetadata {
  id: string;
  name: string;
  providerType: 'microlink' | 'intoli' | 'whatismybrowser' | 'local' | 'opensource-github';
  description: string;
  baseUrl: string;
  requiresApiKey: boolean;
  isConfigured: boolean;
}

export interface UserAgentProvider {
  name: string;
  fetchUserAgents(): Promise<RawUserAgent[]>;
  healthCheck(): Promise<ProviderHealth>;
  getMetadata(): ProviderMetadata;
}
