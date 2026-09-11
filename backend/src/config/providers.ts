export interface ProviderConfig {
  id: string;
  name: string;
  providerType: 'microlink' | 'intoli' | 'whatismybrowser' | 'local';
  baseUrl: string;
  enabled: boolean;
  requiresApiKey: boolean;
  syncIntervalHours: number;
}

export const providerConfigs: Record<string, ProviderConfig> = {
  microlink: {
    id: 'microlink',
    name: 'Microlink Top UAs',
    providerType: 'microlink',
    baseUrl: 'https://raw.githubusercontent.com/microlinkhq/top-user-agents/master/src/desktop.json',
    enabled: true,
    requiresApiKey: false,
    syncIntervalHours: 24,
  },
  intoli: {
    id: 'intoli',
    name: 'Intoli Real User-Agents',
    providerType: 'intoli',
    baseUrl: 'https://raw.githubusercontent.com/intoli/user-agents/master/src/user-agents.json.gz',
    enabled: true,
    requiresApiKey: false,
    syncIntervalHours: 24,
  },
  whatismybrowser: {
    id: 'whatismybrowser',
    name: 'WhatIsMyBrowser API',
    providerType: 'whatismybrowser',
    baseUrl: 'https://api.whatismybrowser.com/api/v2',
    enabled: true,
    requiresApiKey: true,
    syncIntervalHours: 24,
  },
  local: {
    id: 'local',
    name: 'UAForge Real-World Dataset',
    providerType: 'local',
    baseUrl: 'local://datasets/real-uas.json',
    enabled: true,
    requiresApiKey: false,
    syncIntervalHours: 24,
  },
};
