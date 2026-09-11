import { UserAgentProvider, RawUserAgent, ProviderHealth, ProviderMetadata } from '../UserAgentProvider.js';
import { REAL_WORLD_DATASET } from './dataset.js';

export class LocalProvider implements UserAgentProvider {
  readonly name = 'UAForge Real-World Dataset';

  async fetchUserAgents(): Promise<RawUserAgent[]> {
    return REAL_WORLD_DATASET.map((item, idx) => ({
      userAgent: item.ua,
      sourceRecordId: `local-${idx + 1}`,
      weight: item.weight || 10,
      metadata: {
        platform: item.platform,
        browser: item.browser,
        deviceType: item.deviceType,
      },
    }));
  }

  async healthCheck(): Promise<ProviderHealth> {
    return {
      status: 'ONLINE',
      responseTimeMs: 2,
      message: `Verified local dataset with ${REAL_WORLD_DATASET.length} verified real-world records`,
    };
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'local',
      name: this.name,
      providerType: 'local',
      description: 'Curated real-world User-Agent dataset prioritizing Android, iOS, Windows, macOS, and Linux',
      baseUrl: 'local://datasets/real-world.json',
      requiresApiKey: false,
      isConfigured: true,
    };
  }
}
