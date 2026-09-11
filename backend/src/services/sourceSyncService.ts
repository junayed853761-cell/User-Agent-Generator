import { SourceRepository } from '../database/repositories/sourceRepository.js';
import { UserAgentRepository } from '../database/repositories/userAgentRepository.js';
import { getAllProviders, getProvider } from '../providers/index.js';
import { parseUserAgent } from '../parsers/userAgentParser.js';
import { ValidationService } from './validationService.js';
import { ConfidenceService } from './confidenceService.js';
import { logger } from '../utils/logger.js';

export class SourceSyncService {
  private sourceRepo: SourceRepository;
  private uaRepo: UserAgentRepository;
  private validationService: ValidationService;
  private confidenceService: ConfidenceService;

  constructor() {
    this.sourceRepo = new SourceRepository();
    this.uaRepo = new UserAgentRepository();
    this.validationService = new ValidationService();
    this.confidenceService = new ConfidenceService();
  }

  async syncAllSources(): Promise<Record<string, { fetched: number; inserted: number; status: string }>> {
    const providers = getAllProviders();
    const results: Record<string, { fetched: number; inserted: number; status: string }> = {};

    for (const provider of providers) {
      try {
        const res = await this.syncSource(provider.getMetadata().id);
        results[provider.getMetadata().id] = res;
      } catch (error) {
        logger.error(`Error syncing provider ${provider.getMetadata().id}`, error);
        results[provider.getMetadata().id] = { fetched: 0, inserted: 0, status: 'FAILED' };
      }
    }

    return results;
  }

  async syncSource(sourceId: string): Promise<{ fetched: number; inserted: number; status: string }> {
    const provider = getProvider(sourceId);
    if (!provider) {
      throw new Error(`Provider with id '${sourceId}' not found`);
    }

    const metadata = provider.getMetadata();
    const sourceRecord = await this.sourceRepo.getSourceById(sourceId);
    if (sourceRecord && !sourceRecord.enabled) {
      logger.info(`Skipping disabled provider ${sourceId}`);
      return { fetched: 0, inserted: 0, status: 'DISABLED' };
    }

    const startTime = Date.now();
    const runId = await this.sourceRepo.startSyncRun(sourceId);

    try {
      logger.info(`Starting synchronization for provider: ${metadata.name}`);
      const rawRecords = await provider.fetchUserAgents();
      let insertedCount = 0;
      let updatedCount = 0;

      for (const item of rawRecords) {
        // 1. Validate response
        const sourceVal = this.validationService.validateRawSource(item);
        if (!sourceVal.isValid) continue;

        // 2. Parse User-Agent with potential country/language hints
        const countryHint = item.metadata?.country || item.metadata?.language;
        const parsed = parseUserAgent(item.userAgent, countryHint);

        // 3. Compatibility validation
        const compatibility = this.validationService.validateCompatibility(parsed);

        // Check if already in database to count sources
        const existingRecord = await this.uaRepo.findByUserAgent(parsed.raw);
        const existingSourcesCount = (existingRecord?.sources || []).length;
        const totalSources = existingSourcesCount > 0 ? existingSourcesCount + 1 : 1;

        // 4. Confidence calculation
        const confidence = this.confidenceService.calculate({
          parsed,
          compatibility,
          sourcesCount: totalSources,
          isRecent: true,
        });

        // WhatIsMyBrowser official verification bonus ensures top scores 90-100
        let finalScore = confidence.score;
        if (sourceId === 'whatismybrowser') {
          finalScore = Math.min(100, Math.max(90, finalScore + 15));
        } else if (totalSources >= 2 && compatibility.isValid) {
          finalScore = Math.min(100, Math.max(90, finalScore + 10));
        }

        // 5. Deduplicate and Database upsert
        const result = await this.uaRepo.upsertUserAgent(
          {
            userAgent: parsed.raw,
            browser: parsed.browser.name,
            browserVersion: parsed.browser.version,
            browserMajorVersion: parsed.browser.major,
            operatingSystem: parsed.os.name,
            operatingSystemVersion: parsed.os.version,
            deviceType: parsed.device.type,
            deviceBrand: parsed.device.vendor,
            deviceModel: parsed.device.model,
            countryCode: parsed.country.code,
            countryName: parsed.country.name,
            isMobile: parsed.flags.isMobile,
            isTablet: parsed.flags.isTablet,
            isDesktop: parsed.flags.isDesktop,
            confidenceScore: finalScore,
            validationStatus: compatibility.isValid ? 'Validated' : 'Incompatible',
          },
          sourceId,
          item.sourceRecordId
        );

        if (result.isNew) {
          insertedCount++;
        } else {
          updatedCount++;
        }
      }

      const durationMs = Date.now() - startTime;
      await this.sourceRepo.completeSyncRun(runId, {
        status: 'SUCCESS',
        recordsFetched: rawRecords.length,
        recordsInserted: insertedCount,
        recordsUpdated: updatedCount,
        durationMs,
      });

      await this.sourceRepo.updateSourceSyncStatus(sourceId, {
        status: 'ONLINE',
        recordCount: insertedCount + updatedCount,
        isSuccess: true,
      });

      logger.info(`Completed sync for ${metadata.name}: ${insertedCount} inserted, ${updatedCount} updated in ${durationMs}ms`);

      return {
        fetched: rawRecords.length,
        inserted: insertedCount,
        status: 'SUCCESS',
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      const errMsg = error?.message || 'Sync failed';

      await this.sourceRepo.completeSyncRun(runId, {
        status: 'DEGRADED',
        recordsFetched: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        errorMessage: errMsg,
        durationMs,
      });

      // Keep existing data, mark DEGRADED
      await this.sourceRepo.updateSourceSyncStatus(sourceId, {
        status: 'DEGRADED',
        isSuccess: false,
      });

      logger.warn(`Sync failed for ${metadata.name}, retaining prior dataset: ${errMsg}`);

      return {
        fetched: 0,
        inserted: 0,
        status: 'DEGRADED',
      };
    }
  }
}
