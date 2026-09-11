export interface ConfidenceWeights {
  singleSourceBase: number;
  multiSourceBonusPerSource: number;
  multiSourceMaxBonus: number;
  compatibilityBonus: number;
  compatibilityInconsistentPenalty: number;
  compatibilityImpossiblePenalty: number;
  parserCompletenessBonus: number;
  deviceConsistencyBonus: number;
  recentSourceBonus: number;
  obsoleteVersionPenalty: number;
  malformedPenalty: number;
  priorityScoreBonus: number;
}

export const PRIORITY_CONFIDENCE_THRESHOLD = 90;
export const SUSPICIOUS_CONFIDENCE_THRESHOLD = 39; // 0 to 39 range

export const defaultConfidenceWeights: ConfidenceWeights = {
  singleSourceBase: 48,
  multiSourceBonusPerSource: 20,
  multiSourceMaxBonus: 40,
  compatibilityBonus: 16,
  compatibilityInconsistentPenalty: -30,
  compatibilityImpossiblePenalty: -55,
  parserCompletenessBonus: 14,
  deviceConsistencyBonus: 8,
  recentSourceBonus: 5,
  obsoleteVersionPenalty: -25,
  malformedPenalty: -65,
  priorityScoreBonus: 10,
};

export type ConfidenceStatus =
  | 'Very High Confidence'
  | 'High Confidence'
  | 'Medium Confidence'
  | 'Low Confidence'
  | 'Suspicious';

export function getConfidenceStatus(score: number): ConfidenceStatus {
  if (score >= PRIORITY_CONFIDENCE_THRESHOLD) return 'Very High Confidence';
  if (score >= 75) return 'High Confidence';
  if (score >= 60) return 'Medium Confidence';
  if (score >= 40) return 'Low Confidence';
  return 'Suspicious';
}

export function isPriorityConfidence(score: number): boolean {
  return score >= PRIORITY_CONFIDENCE_THRESHOLD;
}

export function isSuspiciousConfidence(score: number): boolean {
  return score <= SUSPICIOUS_CONFIDENCE_THRESHOLD;
}

export const SUSPICIOUS_RANGE_WARNING =
  'CRITICAL WARNING: User-Agent falls into the Suspicious range (0–39). High probability of automated anti-bot triggers, CAPTCHAs, or header verification rejection. Not recommended for production.';

export function getSuspiciousWarningMessage(score: number, details?: string): string {
  const detailStr = details ? ` (${details})` : '';
  return `⚠️ CRITICAL SUSPICIOUS INTEGRITY (Score ${score}/100 in 0–39 Range): High risk of anti-bot fingerprinting, CAPTCHA challenge, or immediate request rejection${detailStr}. Not recommended for production.`;
}

/**
 * Strictly prioritizes records having 90+ confidence scores first,
 * followed by descending confidence score.
 */
export function sortRecordsByPriorityConfidence<T extends { confidence_score?: number; confidence?: { score: number } }>(
  records: T[]
): T[] {
  return [...records].sort((a, b) => {
    const scoreA = a.confidence?.score ?? a.confidence_score ?? 0;
    const scoreB = b.confidence?.score ?? b.confidence_score ?? 0;
    const aIsPriority = scoreA >= PRIORITY_CONFIDENCE_THRESHOLD;
    const bIsPriority = scoreB >= PRIORITY_CONFIDENCE_THRESHOLD;

    if (aIsPriority !== bIsPriority) {
      return aIsPriority ? -1 : 1; // 90+ records strictly prioritized first
    }
    return scoreB - scoreA;
  });
}
