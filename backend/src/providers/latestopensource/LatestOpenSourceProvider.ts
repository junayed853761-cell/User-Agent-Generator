import { UserAgentProvider, RawUserAgent, ProviderHealth, ProviderMetadata } from '../UserAgentProvider.js';
import { logger } from '../../utils/logger.js';

export class LatestOpenSourceProvider implements UserAgentProvider {
  readonly name = 'Latest OpenSource UAs';

  private readonly jnrbsnUrl = 'https://jnrbsn.github.io/user-agents/user-agents.json';
  private readonly fa0311Url = 'https://raw.githubusercontent.com/fa0311/latest-user-agent/main/output.json';

  async fetchUserAgents(): Promise<RawUserAgent[]> {
    const results: RawUserAgent[] = [];
    const seenUAs = new Set<string>();

    const addUa = (raw: string, sourceRecordId: string, repo: string) => {
      const cleaned = raw?.replace(/^['"]|['"]$/g, '').trim();
      if (cleaned && cleaned.length > 15 && !seenUAs.has(cleaned)) {
        seenUAs.add(cleaned);
        results.push({
          userAgent: cleaned,
          sourceRecordId,
          metadata: {
            source: 'latest-opensource-github',
            repository: repo,
          },
        });
      }
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(this.jnrbsnUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.forEach((ua, idx) => {
            addUa(ua, `jnrbsn-${idx + 1}`, 'jnrbsn/user-agents');
          });
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch jnrbsn user agents', { error: err instanceof Error ? err.message : String(err) });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(this.fa0311Url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          Object.values(data).forEach((ua: any, idx) => {
            if (typeof ua === 'string') {
              addUa(ua, `fa0311-${idx + 1}`, 'fa0311/latest-user-agent');
            }
          });
        }
      }
    } catch (err) {
      logger.warn('Failed to fetch fa0311 user agents', { error: err instanceof Error ? err.message : String(err) });
    }

    logger.info(`LatestOpenSourceProvider extracted ${results.length} unique absolute latest User-Agents`);
    return results;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(this.jnrbsnUrl, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        return {
          status: 'ONLINE',
          responseTimeMs: Date.now() - start,
          message: 'Connected to jnrbsn & fa0311 GitHub Pages live streams',
        };
      }
      return {
        status: 'DEGRADED',
        responseTimeMs: Date.now() - start,
        message: 'Endpoint returned ' + res.status,
      };
    } catch {
      return {
        status: 'OFFLINE',
        responseTimeMs: Date.now() - start,
        message: 'Connection failed to open source repositories',
      };
    }
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'latestopensource',
      name: this.name,
      providerType: 'opensource-github',
      description: 'Aggregates bleeding-edge absolute latest User-Agents from automated open-source GitHub repositories (fa0311 & jnrbsn)',
      baseUrl: 'https://github.com/fa0311/latest-user-agent',
      requiresApiKey: false,
      isConfigured: true,
    };
  }
}
