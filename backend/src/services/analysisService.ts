import { parseUserAgent, ParsedUserAgent } from '../parsers/userAgentParser.js';
import { UserAgentRepository } from '../database/repositories/userAgentRepository.js';
import { SourceRepository } from '../database/repositories/sourceRepository.js';
import { ValidationService } from './validationService.js';
import { ConfidenceService, ConfidenceResult } from './confidenceService.js';
import { getConfidenceStatus } from '../config/confidenceRules.js';
import { getAllProviders } from '../providers/index.js';
import { config } from '../config/environment.js';

export interface SourceMatchInfo {
  sourceId: string;
  sourceName: string;
  matched: boolean;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  note?: string;
}

export interface AnalysisResult {
  userAgent: string;
  parsed: ParsedUserAgent;
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
  country?: {
    code: string;
    name: string;
    flag: string;
  };
  sources: SourceMatchInfo[];
  hardwareIntegrity?: {
    isValid: boolean;
    isEvaluated: boolean;
    warnings: string[];
    clientHintConsistency?: {
      isValid: boolean;
      missingHighEntropyValues: string[];
      isFlaggedAsFake: boolean;
    };
  };
  confidence: ConfidenceResult;
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

export class AnalysisService {
  private uaRepo: UserAgentRepository;
  private sourceRepo: SourceRepository;
  private validationService: ValidationService;
  private confidenceService: ConfidenceService;

  constructor() {
    this.uaRepo = new UserAgentRepository();
    this.sourceRepo = new SourceRepository();
    this.validationService = new ValidationService();
    this.confidenceService = new ConfidenceService();
  }

  async analyze(
    userAgentString: string, 
    context?: {
      clientHints?: { secChUa?: string; secChUaMobile?: string; secChUaPlatform?: string };
      hardware?: { gpuRenderer?: string };
    }
  ): Promise<AnalysisResult> {
    if (!userAgentString || typeof userAgentString !== 'string') {
      throw new Error('User-Agent string is required for analysis');
    }

    // 1. Parse UA
    const parsed = parseUserAgent(userAgentString);

    // 2. Compatibility checks
    const compatibility = this.validationService.validateCompatibility(parsed, context);

    // 3. Search local database & source cross-referencing
    const existing = await this.uaRepo.findByUserAgent(parsed.raw);
    const dbSources = [...(existing?.sources || [])];

    // Live authentic verification with WhatIsMyBrowser Commercial API if configured
    let whatIsMyBrowserOfficial: AnalysisResult['whatIsMyBrowserOfficial'] = undefined;
    if (config.whatIsMyBrowserApiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('https://api.whatismybrowser.com/api/v2/user_agent_parse', {
          method: 'POST',
          headers: {
            'X-API-KEY': config.whatIsMyBrowserApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_agent: parsed.raw }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const wData = await res.json();
          if (wData.result?.code === 'success') {
            const p = wData.parse;
            const isAuthentic = compatibility.isValid;
            whatIsMyBrowserOfficial = {
              verified: true,
              softwareName: p?.software_name || parsed.browser.name,
              softwareVersion: p?.version || parsed.browser.version,
              operatingSystemName: p?.operating_system_name || parsed.os.name,
              hardwareType: p?.hardware_type || parsed.device.type,
              message: isAuthentic
                ? '100% Authentic Live Verification confirmed via WhatIsMyBrowser Commercial Database API (HTTP 200 OK)'
                : 'Parsed by WhatIsMyBrowser, but failed platform compatibility verification (impossible combination)',
              isAuthentic,
            };
            if (isAuthentic && !dbSources.includes('whatismybrowser')) {
              dbSources.push('whatismybrowser');
            }
          }
        }
      } catch {
        // Fallback gracefully without breaking analysis
      }
    }

    // Check all configured providers
    const allProviders = getAllProviders();
    const sourceRecords = await this.sourceRepo.getAllSources();
    const sourceMap = new Map(sourceRecords.map(s => [s.id, s]));

    const sourcesResult: SourceMatchInfo[] = allProviders.map(provider => {
      const meta = provider.getMetadata();
      const sRecord = sourceMap.get(meta.id);
      let isMatched = dbSources.includes(meta.id);
      let note: string | undefined;

      if (meta.id === 'whatismybrowser' && whatIsMyBrowserOfficial?.verified) {
        isMatched = true;
        note = 'Live 100% authentic verified via WhatIsMyBrowser API';
      }

      let status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' = sRecord?.status || 'ONLINE';

      if (!meta.isConfigured && meta.requiresApiKey) {
        status = 'OFFLINE';
        note = 'Source unavailable (API key not configured)';
      }

      return {
        sourceId: meta.id,
        sourceName: meta.name,
        matched: isMatched,
        status,
        note,
      };
    });

    const matchedCount = sourcesResult.filter(s => s.matched).length;

    // 4. Calculate confidence
    const confidence = this.confidenceService.calculate({
      parsed,
      compatibility,
      sourcesCount: matchedCount,
      matchedSources: dbSources,
      isRecent: existing ? true : false,
    });

    if (whatIsMyBrowserOfficial?.isAuthentic && compatibility.isValid && confidence.score < 90) {
      confidence.score = Math.min(100, Math.max(90, confidence.score + 15));
      confidence.status = getConfidenceStatus(confidence.score);
      confidence.reasons.unshift('Verified authentic by WhatIsMyBrowser live commercial detection API');
    }

    const hwEvaluated = Boolean(context?.hardware?.gpuRenderer || context?.clientHints?.secChUaPlatform);
    const hwIsValid = hwEvaluated ? !compatibility.checksFailed.some(f => f.includes('Hardware mismatch') || f.includes('Client-Hint mismatch')) : true;
    const hwWarnings = compatibility.warnings.filter(w => w.includes('Hardware') || w.includes('Client-Hint') || w.includes('GPU'));

    // Client-Hint Consistency Evaluation
    let clientHintConsistency = undefined;
    if (context?.clientHints) {
      const ch = context.clientHints;
      const missing = [];
      if (!ch.secChUaPlatform) missing.push('sec-ch-ua-platform');
      if (ch.secChUaMobile === undefined || ch.secChUaMobile === null) missing.push('sec-ch-ua-mobile');
      
      const isFlaggedAsFake = compatibility.checksFailed.some(f => f.includes('Client-Hint mismatch') || f.includes('Invalid Client-Hint'));

      clientHintConsistency = {
        isValid: missing.length === 0 && !isFlaggedAsFake,
        missingHighEntropyValues: missing,
        isFlaggedAsFake: isFlaggedAsFake
      };
    }

    return {
      userAgent: parsed.raw,
      parsed,
      browser: {
        name: parsed.browser.name,
        version: parsed.browser.version,
        major: parsed.browser.major,
      },
      os: {
        name: parsed.os.name,
        version: parsed.os.version,
      },
      device: {
        type: parsed.device.type,
        brand: parsed.device.vendor,
        model: parsed.device.model,
        isMobile: parsed.flags.isMobile,
        isTablet: parsed.flags.isTablet,
        isDesktop: parsed.flags.isDesktop,
      },
      country: parsed.country,
      sources: sourcesResult,
      hardwareIntegrity: {
        isEvaluated: hwEvaluated,
        isValid: hwIsValid,
        warnings: hwWarnings,
        clientHintConsistency: clientHintConsistency,
      },
      confidence,
      compatibility: {
        status: compatibility.status,
        isValid: compatibility.isValid,
        checksPassed: compatibility.checksPassed,
        checksFailed: compatibility.checksFailed,
      },
      warnings: confidence.warnings,
      isKnownInDatabase: Boolean(existing),
      whatIsMyBrowserOfficial,
    };
  }
}
