import {
  DashboardStats,
  SourceItem,
  SyncRunItem,
  SchedulerStatus,
  GeneratedUserAgent,
  AnalysisResult,
  GenerationHistoryItem,
  SystemHealth,
  DatabaseStatus,
} from '../types';

const API_BASE = '/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const json = await res.json();
      if (json?.error?.message) {
        errorMsg = json.error.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export function getClientId(): string {
  if (typeof window === 'undefined') return 'server_client';
  let id = localStorage.getItem('uaforge_client_id');
  if (!id) {
    id = 'client_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem('uaforge_client_id', id);
  }
  return id;
}

export const api = {
  async getStats(): Promise<{ stats: DashboardStats; sources: any[]; recentSyncRuns: SyncRunItem[] }> {
    const res = await fetch(`${API_BASE}/stats`);
    const json = await handleResponse<{ data: any }>(res);
    return json.data;
  },

  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse<SystemHealth>(res);
  },

  async generate(params: {
    platform?: string;
    deviceType?: string;
    browser?: string;
    country?: string;
    minimumConfidence?: number;
    source?: string;
    quantity?: number;
    clientId?: string;
  }): Promise<GeneratedUserAgent[] & { meta?: { totalServedToYou?: number; zeroDuplicateActive?: boolean; count?: number } }> {
    const clientId = params.clientId || getClientId();
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
      },
      body: JSON.stringify({ ...params, clientId }),
    });
    const json = await handleResponse<{ data: GeneratedUserAgent[]; meta?: any }>(res);
    const items = json.data as any;
    items.meta = json.meta;
    return items;
  },

  async getServedStats(): Promise<{ servedCount: number }> {
    const clientId = getClientId();
    const res = await fetch(`${API_BASE}/generate/served-stats?clientId=${encodeURIComponent(clientId)}`, {
      headers: { 'x-client-id': clientId },
    });
    const json = await handleResponse<{ data: { servedCount: number } }>(res);
    return json.data;
  },

  async resetServed(): Promise<{ resetCount: number; message: string }> {
    const clientId = getClientId();
    const res = await fetch(`${API_BASE}/generate/reset-served`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
      },
      body: JSON.stringify({ clientId }),
    });
    const json = await handleResponse<{ data: { resetCount: number }; message: string }>(res);
    return { resetCount: json.data.resetCount, message: json.message };
  },

  async analyze(userAgent: string): Promise<AnalysisResult> {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAgent }),
    });
    const json = await handleResponse<{ data: AnalysisResult }>(res);
    return json.data;
  },

  async getSources(): Promise<SourceItem[]> {
    const res = await fetch(`${API_BASE}/sources`);
    const json = await handleResponse<{ data: SourceItem[] }>(res);
    return json.data;
  },

  async getSyncRuns(): Promise<SyncRunItem[]> {
    const res = await fetch(`${API_BASE}/sources/runs`);
    const json = await handleResponse<{ data: SyncRunItem[] }>(res);
    return json.data;
  },

  async getSchedulerStatus(): Promise<SchedulerStatus> {
    const res = await fetch(`${API_BASE}/sources/scheduler/status`);
    const json = await handleResponse<{ data: SchedulerStatus }>(res);
    return json.data;
  },

  async triggerDailySync(): Promise<any> {
    const res = await fetch(`${API_BASE}/sources/scheduler/trigger`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async triggerSync(sourceId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/sources/${sourceId}/sync`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  async toggleSource(sourceId: string, enabled: boolean): Promise<any> {
    const res = await fetch(`${API_BASE}/sources/${sourceId}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    return handleResponse(res);
  },

  async getHistory(): Promise<GenerationHistoryItem[]> {
    const res = await fetch(`${API_BASE}/history`);
    const json = await handleResponse<{ data: GenerationHistoryItem[] }>(res);
    return json.data;
  },

  getExportUrl(
    params: {
      platform?: string;
      deviceType?: string;
      browser?: string;
      country?: string;
      minimumConfidence?: number;
      source?: string;
    },
    format: 'json' | 'csv' | 'txt'
  ): string {
    const query = new URLSearchParams();
    if (params.platform && params.platform !== 'all') query.set('platform', params.platform);
    if (params.deviceType && params.deviceType !== 'all') query.set('deviceType', params.deviceType);
    if (params.browser && params.browser !== 'all') query.set('browser', params.browser);
    if (params.country && params.country !== 'all') query.set('country', params.country);
    if (params.minimumConfidence) query.set('minimumConfidence', String(params.minimumConfidence));
    if (params.source && params.source !== 'all') query.set('source', params.source);
    query.set('format', format);
    query.set('limit', '500');
    query.set('clientId', getClientId());

    return `${API_BASE}/user-agents/export?${query.toString()}`;
  },

  async getDatabaseStatus(): Promise<DatabaseStatus> {
    const res = await fetch(`${API_BASE}/database/status`);
    const json = await handleResponse<{ data: DatabaseStatus }>(res);
    return json.data;
  },

  async migrateDatabase(): Promise<any> {
    const res = await fetch(`${API_BASE}/database/migrate`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
};
