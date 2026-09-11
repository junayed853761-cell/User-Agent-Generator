import { describe, it, expect } from 'vitest';
import { parseUserAgent } from '../src/parsers/userAgentParser.js';
import { CompatibilityValidator } from '../src/validators/compatibilityValidator.js';

describe('CompatibilityValidator', () => {
  const validator = new CompatibilityValidator();

  it('validates a genuine modern User-Agent as COMPATIBLE', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
    const parsed = parseUserAgent(ua);
    const result = validator.validate(parsed);

    expect(result.isValid).toBe(true);
    expect(result.status).toBe('COMPATIBLE');
    expect(result.checksFailed.length).toBe(0);
  });

  it('flags impossible Safari version on Windows as INCOMPATIBLE', () => {
    // Safari v17 on Windows NT is impossible (Safari for Windows stopped at v5.1.7)
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    const parsed = parseUserAgent(ua);
    const result = validator.validate(parsed);

    expect(result.status).toBe('INCOMPATIBLE');
    expect(result.checksFailed).toContain('Safari v6+ is impossible on Windows');
  });

  it('flags malformed syntax with unclosed parentheses as MALFORMED', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36';
    const parsed = parseUserAgent(ua);
    const result = validator.validate(parsed);

    expect(result.status).toBe('MALFORMED');
    expect(result.checksFailed).toContain('Unbalanced parentheses in UA string');
  });
});
