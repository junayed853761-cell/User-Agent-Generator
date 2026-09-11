import { SourceSyncService } from '../services/sourceSyncService.js';
import { UserAgentRepository } from '../database/repositories/userAgentRepository.js';
import { logger } from '../utils/logger.js';

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

export class SourceSyncJob {
  private syncService: SourceSyncService;
  private uaRepo: UserAgentRepository;
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastRunAt: string | null = null;
  private nextRunAt: string | null = null;
  private totalRuns: number = 0;
  private lastResults: Record<string, { fetched: number; inserted: number; status: string }> | null = null;
  private lastError: string | null = null;

  // 24 hours in milliseconds for standard daily automated database population
  private readonly DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;

  constructor() {
    this.syncService = new SourceSyncService();
    this.uaRepo = new UserAgentRepository();
  }

  async start() {
    logger.info('Initializing automated daily SourceSyncJob worker');

    // 1. Immediate bootstrap: perform initial population upon server start
    await this.runSyncCycle('startup-bootstrap');

    // 2. Schedule recurring 24-hour daily population
    this.scheduleNextRun();
  }

  private scheduleNextRun() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }

    this.nextRunAt = new Date(Date.now() + this.DAILY_INTERVAL_MS).toISOString();
    logger.info(`Scheduled next daily source synchronization for: ${this.nextRunAt}`);

    this.intervalTimer = setInterval(async () => {
      logger.info('Executing scheduled daily source synchronization across all repositories and datasets');
      await this.runSyncCycle('scheduled-daily');
      this.nextRunAt = new Date(Date.now() + this.DAILY_INTERVAL_MS).toISOString();
    }, this.DAILY_INTERVAL_MS);
  }

  async runSyncCycle(triggerReason: string = 'manual'): Promise<Record<string, { fetched: number; inserted: number; status: string }>> {
    if (this.isRunning) {
      logger.warn(`Source synchronization already in progress, skipping trigger: ${triggerReason}`);
      return this.lastResults || {};
    }

    this.isRunning = true;
    this.lastError = null;
    const startTime = Date.now();
    logger.info(`[SourceSyncJob] Starting source synchronization cycle (Reason: ${triggerReason})`);

    try {
      // Ensure country backfill migration
      await this.uaRepo.backfillCountries().catch(err => {
        logger.warn('Country backfill notice during sync cycle', { error: err });
      });

      // Synchronize all sources: Microlink HQ, Intoli real-world, WhatIsMyBrowser, and UAForge
      const results = await this.syncService.syncAllSources();

      this.lastRunAt = new Date().toISOString();
      this.lastResults = results;
      this.totalRuns++;

      let totalFetched = 0;
      let totalInserted = 0;
      Object.values(results).forEach(r => {
        totalFetched += r.fetched || 0;
        totalInserted += r.inserted || 0;
      });

      const elapsed = Date.now() - startTime;
      logger.info(`[SourceSyncJob] Completed sync cycle in ${elapsed}ms: ${totalFetched} fetched, ${totalInserted} newly inserted/indexed`);

      return results;
    } catch (err: any) {
      this.lastError = err?.message || String(err);
      logger.error('[SourceSyncJob] Error during source synchronization cycle', err);
      throw err;
    } finally {
      this.isRunning = false;
    }
  }

  async triggerSyncNow(): Promise<Record<string, { fetched: number; inserted: number; status: string }>> {
    const results = await this.runSyncCycle('manual-api-trigger');
    // Reset next scheduled run 24 hours from this successful trigger
    this.scheduleNextRun();
    return results;
  }

  getStatus(): SchedulerStatus {
    return {
      status: this.isRunning ? 'SYNCING' : this.lastError ? 'ERROR' : 'IDLE',
      cadence: 'DAILY (Every 24 Hours)',
      intervalMs: this.DAILY_INTERVAL_MS,
      lastRunAt: this.lastRunAt,
      nextRunAt: this.nextRunAt,
      totalRuns: this.totalRuns,
      isRunning: this.isRunning,
      lastResults: this.lastResults,
      lastError: this.lastError,
    };
  }

  stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
      logger.info('Automated daily SourceSyncJob worker stopped');
    }
  }
}

// Export singleton instance for app-wide coordination
export const defaultSourceSyncJob = new SourceSyncJob();
