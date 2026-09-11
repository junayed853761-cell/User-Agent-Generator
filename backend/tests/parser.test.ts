import { describe, it, expect } from 'vitest';
import { parseUserAgent } from '../src/parsers/userAgentParser.js';

describe('UserAgentParser', () => {
  it('correctly parses modern Android Chrome User-Agent', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro Build/AP2A.240905.003) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36';
    const parsed = parseUserAgent(ua);

    expect(parsed.browser.name).toContain('Chrome');
    expect(parsed.browser.major).toBe('131');
    expect(parsed.os.name).toBe('Android');
    expect(parsed.flags.isMobile).toBe(true);
    expect(parsed.device.type).toBe('mobile');
    expect(parsed.parserCompleteness).toBeGreaterThan(70);
  });

  it('correctly parses modern iPhone Safari User-Agent', () => {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
    const parsed = parseUserAgent(ua);

    expect(parsed.browser.name).toBe('Mobile Safari');
    expect(parsed.os.name).toBe('iOS');
    expect(parsed.flags.isMobile).toBe(true);
    expect(parsed.device.type).toBe('mobile');
  });

  it('correctly parses Windows Desktop Edge User-Agent', () => {
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0';
    const parsed = parseUserAgent(ua);

    expect(parsed.browser.name).toBe('Edge');
    expect(parsed.os.name).toBe('Windows');
    expect(parsed.flags.isDesktop).toBe(true);
    expect(parsed.device.type).toBe('desktop');
  });
});
