import { UserAgentRepository, UserAgentRecord, UserAgentFilters } from '../database/repositories/userAgentRepository.js';
import { HistoryRepository } from '../database/repositories/historyRepository.js';
import { getConfidenceStatus, sortRecordsByPriorityConfidence } from '../config/confidenceRules.js';
import { detectCountry, getCountryByCode } from '../utils/countryDetector.js';

export interface GenerationRequest {
  platform?: string;
  deviceType?: string;
  browser?: string;
  country?: string;
  minimumConfidence?: number;
  source?: string;
  quantity?: number;
  userId?: number | null;
  clientId?: string;
}

export interface GeneratedUserAgentItem {
  id: number;
  userAgent: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  deviceBrand: string;
  deviceModel: string;
  country: {
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

export class GenerationService {
  private uaRepo: UserAgentRepository;
  private historyRepo: HistoryRepository;

  constructor() {
    this.uaRepo = new UserAgentRepository();
    this.historyRepo = new HistoryRepository();
  }

  async generate(req: GenerationRequest): Promise<GeneratedUserAgentItem[]> {
    const quantity = Math.min(50, Math.max(1, req.quantity || 1));
    // Default to 80+ confidence score as requested by user
    const minConfidence = req.minimumConfidence !== undefined ? Number(req.minimumConfidence) : 80;

    // Zero-Duplicate Guarantee: enforce clientId tracking per user/session
    const clientId =
      req.clientId && req.clientId.trim()
        ? req.clientId.trim()
        : req.userId
        ? `user_${req.userId}`
        : 'default_client';

    const filters: UserAgentFilters = {
      platform: req.platform,
      deviceType: req.deviceType,
      browser: req.browser,
      country: req.country,
      minimumConfidence: minConfidence,
      source: req.source,
      clientId,
    };

    const records = await this.uaRepo.getRandomValidatedRecords(filters, quantity);

    const items: GeneratedUserAgentItem[] = records.map((r: UserAgentRecord) => {
      const sources = r.sources || [];
      const countryInfo = r.country_code
        ? getCountryByCode(r.country_code)
        : detectCountry(r.user_agent);

      return {
        id: r.id,
        userAgent: r.user_agent,
        browser: r.browser || 'Unknown',
        browserVersion: r.browser_version || '',
        os: r.operating_system || 'Unknown',
        osVersion: r.operating_system_version || '',
        deviceType: r.device_type || 'desktop',
        deviceBrand: r.device_brand || '',
        deviceModel: r.device_model || '',
        country: countryInfo,
        confidence: {
          score: r.confidence_score,
          status: getConfidenceStatus(r.confidence_score),
        },
        sourcesCount: sources.length,
        sources,
      };
    });

    // Record generation history for auditing and user history view
    await this.historyRepo.recordGeneration({
      userId: req.userId || null,
      platform: req.platform || 'All',
      deviceType: req.deviceType || 'All',
      browser: req.browser || 'All',
      minConfidence,
      quantity,
      resultCount: items.length,
    });

    return sortRecordsByPriorityConfidence(items);
  }

  async getServedStats(clientId: string): Promise<{ servedCount: number }> {
    const servedCount = await this.uaRepo.getServedCount(clientId);
    return { servedCount };
  }

  async resetServed(clientId: string): Promise<{ resetCount: number }> {
    const resetCount = await this.uaRepo.resetServedRecords(clientId);
    return { resetCount };
  }
}
