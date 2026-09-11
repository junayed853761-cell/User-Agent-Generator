import {
  defaultConfidenceWeights,
  getConfidenceStatus,
  isPriorityConfidence,
  isSuspiciousConfidence,
  getSuspiciousWarningMessage,
  ConfidenceStatus,
  ConfidenceWeights,
} from '../config/confidenceRules.js';
import { ParsedUserAgent } from '../parsers/userAgentParser.js';
import { CompatibilityCheckResult } from '../validators/compatibilityValidator.js';

export interface ConfidenceCalculationInput {
  parsed: ParsedUserAgent;
  compatibility: CompatibilityCheckResult;
  sourcesCount: number;
  matchedSources?: string[];
  isRecent?: boolean;
}

export interface ConfidenceResult {
  score: number;
  status: ConfidenceStatus;
  reasons: string[];
  warnings: string[];
  breakdown: {
    baseSourceScore: number;
    multiSourceBonus: number;
    compatibilityModifier: number;
    parserScore: number;
    deviceConsistencyScore: number;
    recencyBonus: number;
  };
}

export class ConfidenceService {
  private weights: ConfidenceWeights;

  constructor(weights: ConfidenceWeights = defaultConfidenceWeights) {
    this.weights = weights;
  }

  calculate(input: ConfidenceCalculationInput): ConfidenceResult {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [...input.compatibility.warnings];

    // 1. Source Presence
    let baseSourceScore = 0;
    if (input.sourcesCount > 0) {
      baseSourceScore = this.weights.singleSourceBase;
      score += baseSourceScore;
      reasons.push('Present in verified dataset source');
    } else {
      warnings.push('User-Agent string was not found in any public verified dataset');
    }

    // 2. Multiple-Source Agreement
    let multiSourceBonus = 0;
    if (input.sourcesCount > 1) {
      const extraSources = input.sourcesCount - 1;
      multiSourceBonus = Math.min(
        this.weights.multiSourceMaxBonus,
        extraSources * this.weights.multiSourceBonusPerSource
      );
      score += multiSourceBonus;
      reasons.push(`Cross-verified across ${input.sourcesCount} distinct data sources`);
    }

    // 3. Compatibility Engine Outcome
    let compatibilityModifier = 0;
    if (input.compatibility.status === 'COMPATIBLE') {
      compatibilityModifier = this.weights.compatibilityBonus;
      score += compatibilityModifier;
      reasons.push('Browser/OS platform combination is fully compatible');
    } else if (input.compatibility.status === 'SUSPICIOUS') {
      compatibilityModifier = this.weights.compatibilityInconsistentPenalty;
      score += compatibilityModifier;
      warnings.push('Suspicious platform or token distribution detected');
    } else if (input.compatibility.status === 'INCOMPATIBLE') {
      compatibilityModifier = this.weights.compatibilityImpossiblePenalty;
      score += compatibilityModifier;
      warnings.push('Impossible browser/OS combination detected');
    } else if (input.compatibility.status === 'OBSOLETE') {
      compatibilityModifier = this.weights.obsoleteVersionPenalty;
      score += compatibilityModifier;
      warnings.push('Inconsistent pairing of modern browser version on legacy OS');
    } else if (input.compatibility.status === 'MALFORMED') {
      compatibilityModifier = this.weights.malformedPenalty;
      score += compatibilityModifier;
      warnings.push('Malformed User-Agent header structure');
    }

    // 4. Parser Confidence & Token Completeness
    const parserRatio = input.parsed.parserCompleteness / 100;
    const parserScore = Math.round(parserRatio * this.weights.parserCompletenessBonus);
    score += parserScore;
    if (input.parsed.parserCompleteness >= 80) {
      reasons.push('Parser recognized all primary browser and OS version tokens');
    }

    // 5. Device Consistency
    let deviceConsistencyScore = 0;
    if (
      (input.parsed.flags.isMobile && (input.parsed.os.name === 'Android' || input.parsed.os.name === 'iOS')) ||
      (input.parsed.flags.isDesktop && ['Windows', 'macOS', 'Linux'].includes(input.parsed.os.name))
    ) {
      deviceConsistencyScore = this.weights.deviceConsistencyBonus;
      score += deviceConsistencyScore;
      reasons.push('Device category matches target OS architecture');
    }

    // 6. Recency
    let recencyBonus = 0;
    if (input.isRecent !== false) {
      recencyBonus = this.weights.recentSourceBonus;
      score += recencyBonus;
      reasons.push('Recent source synchronization data available');
    }

    // 7. Commercial API Verification or Cross-Verified 90+ Priority Promotion
    if (input.matchedSources?.some(s => s.toLowerCase().includes('whatismybrowser'))) {
      score += 12;
      reasons.push('Directly validated via WhatIsMyBrowser commercial API');
    } else if (input.sourcesCount >= 2 && input.compatibility.status === 'COMPATIBLE') {
      score += this.weights.priorityScoreBonus;
      reasons.push('Multi-source consensus qualifies for 90+ Priority Tier');
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));
    const status = getConfidenceStatus(score);

    // Strictly prioritize 90+ score records with explicit affirmations
    if (isPriorityConfidence(score)) {
      reasons.unshift('⭐ Strictly Prioritized Record: 90+ Very High Confidence Tier verified');
    }

    // Add explicit warnings if record falls into Suspicious range (0-39)
    if (isSuspiciousConfidence(score) || status === 'Suspicious') {
      const suspiciousWarning = getSuspiciousWarningMessage(
        score,
        input.compatibility.warnings.length > 0 ? input.compatibility.warnings.join('; ') : undefined
      );
      warnings.unshift(suspiciousWarning);
      warnings.push(
        'High anomaly risk: Record falls in 0–39 range; prone to immediate anti-bot challenges and synthetic fingerprint alarms.'
      );
    }

    return {
      score,
      status,
      reasons,
      warnings,
      breakdown: {
        baseSourceScore,
        multiSourceBonus,
        compatibilityModifier,
        parserScore,
        deviceConsistencyScore,
        recencyBonus,
      },
    };
  }
}
