import crypto from 'crypto';

/**
 * Normalizes a User-Agent string (trims excess whitespace)
 * and generates its SHA-256 hash for deduplication.
 */
export function normalizeUserAgent(ua: string): string {
  if (!ua) return '';
  return ua.trim().replace(/\s+/g, ' ');
}

export function hashUserAgent(ua: string): string {
  const normalized = normalizeUserAgent(ua);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}
