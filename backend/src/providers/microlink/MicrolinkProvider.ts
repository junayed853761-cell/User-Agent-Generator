import { UserAgentProvider, RawUserAgent, ProviderHealth, ProviderMetadata } from '../UserAgentProvider.js';
import { logger } from '../../utils/logger.js';
import topUserAgents from 'top-user-agents';
import topDesktopUserAgents from 'top-user-agents/desktop';
import topMobileUserAgents from 'top-user-agents/mobile';

export class MicrolinkProvider implements UserAgentProvider {
  readonly name = 'Microlink top-user-agents';
  private readonly githubRepoUrl = 'https://github.com/microlinkhq/top-user-agents';
  private readonly desktopUrl = 'https://raw.githubusercontent.com/microlinkhq/top-user-agents/master/src/desktop.json';
  private readonly mobileUrl = 'https://raw.githubusercontent.com/microlinkhq/top-user-agents/master/src/mobile.json';
  private readonly indexUrl = 'https://raw.githubusercontent.com/microlinkhq/top-user-agents/master/src/index.json';
  private readonly crawlerUrl = 'https://raw.githubusercontent.com/Kikobeats/top-crawler-agents/master/index.json';

  // CDN fallbacks in case of GitHub raw rate-limiting
  private readonly cdnDesktopUrl = 'https://cdn.jsdelivr.net/npm/top-user-agents/src/desktop.json';
  private readonly cdnMobileUrl = 'https://cdn.jsdelivr.net/npm/top-user-agents/src/mobile.json';
  private readonly cdnIndexUrl = 'https://cdn.jsdelivr.net/npm/top-user-agents/src/index.json';

  async fetchUserAgents(): Promise<RawUserAgent[]> {
    const results: RawUserAgent[] = [];
    const seenUAs = new Set<string>();

    const cleanUa = (raw: any): string => {
      if (!raw || typeof raw !== 'string') return '';
      return raw.replace(/^['"]|['"]$/g, '').trim();
    };

    const addUa = (raw: any, sourceRecordId: string, metadata: Record<string, any>) => {
      const cleaned = cleanUa(raw);
      if (cleaned && cleaned.length > 15 && !seenUAs.has(cleaned)) {
        seenUAs.add(cleaned);
        results.push({
          userAgent: cleaned,
          sourceRecordId,
          metadata: {
            ...metadata,
            repository: 'microlinkhq/top-user-agents',
          },
        });
      }
    };

    // 1. Fetch live from official Microlink HQ GitHub repository & Kikobeats crawler agents
    const fetchJson = async (primaryUrl: string, fallbackUrl?: string): Promise<any[]> => {
      const urls = fallbackUrl ? [primaryUrl, fallbackUrl] : [primaryUrl];
      for (const u of urls) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(u, { signal: controller.signal });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) return data;
          }
        } catch {
          // try next url
        }
      }
      return [];
    };

    try {
      const [remoteDesktop, remoteMobile, remoteIndex, remoteCrawler] = await Promise.allSettled([
        fetchJson(this.desktopUrl, this.cdnDesktopUrl),
        fetchJson(this.mobileUrl, this.cdnMobileUrl),
        fetchJson(this.indexUrl, this.cdnIndexUrl),
        fetchJson(this.crawlerUrl),
      ]);

      if (remoteDesktop.status === 'fulfilled' && remoteDesktop.value.length > 0) {
        remoteDesktop.value.forEach((ua, idx) => {
          addUa(ua, `microlink-hq-desktop-${idx + 1}`, {
            platformType: 'desktop',
            rank: idx + 1,
            source: 'microlink-hq-github',
          });
        });
      }

      if (remoteMobile.status === 'fulfilled' && remoteMobile.value.length > 0) {
        remoteMobile.value.forEach((ua, idx) => {
          addUa(ua, `microlink-hq-mobile-${idx + 1}`, {
            platformType: 'mobile',
            rank: idx + 1,
            source: 'microlink-hq-github',
          });
        });
      }

      if (remoteIndex.status === 'fulfilled' && remoteIndex.value.length > 0) {
        remoteIndex.value.forEach((ua, idx) => {
          addUa(ua, `microlink-hq-all-${idx + 1}`, {
            rank: idx + 1,
            source: 'microlink-hq-github',
          });
        });
      }

      if (remoteCrawler.status === 'fulfilled' && remoteCrawler.value.length > 0) {
        remoteCrawler.value.forEach((ua, idx) => {
          addUa(ua, `microlink-hq-crawler-${idx + 1}`, {
            deviceCategory: 'crawler',
            platformType: 'bot',
            rank: idx + 1,
            source: 'kikobeats-top-crawler-agents',
          });
        });
      }
    } catch (err) {
      logger.warn('Remote Microlink HQ live pull encountered an issue, supplementing with local package records', {
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // 2. Ensure bundled top-user-agents package records are also merged
    const desktopList: string[] = Array.isArray(topDesktopUserAgents)
      ? (topDesktopUserAgents as any)
      : (topDesktopUserAgents as any)?.default || [];
    const mobileList: string[] = Array.isArray(topMobileUserAgents)
      ? (topMobileUserAgents as any)
      : (topMobileUserAgents as any)?.default || [];
    const allList: string[] = Array.isArray(topUserAgents)
      ? (topUserAgents as any)
      : (topUserAgents as any)?.default || [];

    desktopList.forEach((ua, i) => {
      addUa(ua, `microlink-pkg-desktop-${i + 1}`, {
        platformType: 'desktop',
        rank: i + 1,
        source: 'microlink-npm-package',
      });
    });

    mobileList.forEach((ua, i) => {
      addUa(ua, `microlink-pkg-mobile-${i + 1}`, {
        platformType: 'mobile',
        rank: i + 1,
        source: 'microlink-npm-package',
      });
    });

    allList.forEach((ua, i) => {
      addUa(ua, `microlink-pkg-all-${i + 1}`, {
        rank: i + 1,
        source: 'microlink-npm-package',
      });
    });

    logger.info(`MicrolinkProvider extracted ${results.length} unique authentic User-Agents from Microlink HQ repository & package`);
    return results;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(this.desktopUrl, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      const duration = Date.now() - start;

      if (res.ok) {
        return {
          status: 'ONLINE',
          responseTimeMs: duration,
          message: 'Official microlinkhq/top-user-agents active (GitHub live pull verified)',
        };
      }
      return {
        status: 'ONLINE',
        responseTimeMs: duration,
        message: 'Microlink HQ package ready (upstream CDN returned ' + res.status + ')',
      };
    } catch {
      return {
        status: 'ONLINE',
        responseTimeMs: Date.now() - start,
        message: 'Microlink HQ dataset ready with local cached definitions',
      };
    }
  }

  getMetadata(): ProviderMetadata {
    return {
      id: 'microlink',
      name: this.name,
      providerType: 'microlink',
      description: 'Official open-source top-user-agents dataset (github.com/microlinkhq/top-user-agents) with real-world rankings',
      baseUrl: this.githubRepoUrl,
      requiresApiKey: false,
      isConfigured: true,
    };
  }
}
