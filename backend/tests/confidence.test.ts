import { describe, it, expect } from 'vitest';
import { parseUserAgent } from '../src/parsers/userAgentParser.js';
import { CompatibilityValidator } from '../src/validators/compatibilityValidator.js';
import { ConfidenceService } from '../src/services/confidenceService.js';
import {
  isPriorityConfidence,
  isSuspiciousConfidence,
  sortRecordsByPriorityConfidence,
  PRIORITY_CONFIDENCE_THRESHOLD,
  SUSPICIOUS_CONFIDENCE_THRESHOLD,
} from '../src/config/confidenceRules.js';

describe('ConfidenceService & confidenceRules', () => {
  const compValidator = new CompatibilityValidator();
  const confidenceService = new ConfidenceService();

  it('calculates 90+ Very High Confidence for cross-verified, compatible UA', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    const parsed = parseUserAgent(ua);
    const compatibility = compValidator.validate(parsed);

    const result = confidenceService.calculate({
      parsed,
      compatibility,
      sourcesCount: 3,
      isRecent: true,
    });

    expect(result.score).toBeGreaterThanOrEqual(PRIORITY_CONFIDENCE_THRESHOLD);
    expect(result.status).toBe('Very High Confidence');
    expect(isPriorityConfidence(result.score)).toBe(true);
    expect(result.reasons.some((r) => r.includes('Strictly Prioritized'))).toBe(true);
  });

  it('drops confidence score into Suspicious range (0-39) with explicit warnings for incompatible/impossible UA', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    const parsed = parseUserAgent(ua);
    const compatibility = compValidator.validate(parsed);

    const result = confidenceService.calculate({
      parsed,
      compatibility,
      sourcesCount: 0,
      isRecent: false,
    });

    expect(result.score).toBeLessThanOrEqual(SUSPICIOUS_CONFIDENCE_THRESHOLD);
    expect(result.status).toBe('Suspicious');
    expect(isSuspiciousConfidence(result.score)).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    // Explicit suspicious visual warning prefix
    expect(result.warnings.some((w) => w.includes('CRITICAL SUSPICIOUS INTEGRITY') || w.includes('0–39 Range'))).toBe(true);
  });

  it('sortRecordsByPriorityConfidence strictly prioritizes 90+ records over lower tiers', () => {
    const records = [
      { id: 1, confidence_score: 78 },
      { id: 2, confidence_score: 95 },
      { id: 3, confidence_score: 30 },
      { id: 4, confidence_score: 91 },
      { id: 5, confidence_score: 85 },
    ];

    const sorted = sortRecordsByPriorityConfidence(records);
    expect(sorted.map((r) => r.id)).toEqual([2, 4, 5, 1, 3]);
    expect(sorted[0].confidence_score).toBe(95);
    expect(sorted[1].confidence_score).toBe(91);
  });
});
