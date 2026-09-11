import { UAParser } from 'ua-parser-js';
import { normalizeUserAgent } from '../utils/hash.js';
import { detectCountry, CountryInfo } from '../utils/countryDetector.js';

export interface ParsedUserAgent {
  raw: string;
  normalized: string;
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
    type: 'mobile' | 'tablet' | 'desktop';
    vendor: string;
    model: string;
  };
  flags: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };
  country: CountryInfo;
  parserCompleteness: number; // 0 to 100
}

export function parseUserAgent(uaString: string, countryHint?: string): ParsedUserAgent {
  const normalized = normalizeUserAgent(uaString);
  const parser = new UAParser(normalized);
  const result = parser.getResult();

  const browserName = result.browser.name || 'Unknown Browser';
  const browserVersion = result.browser.version || '';
  const browserMajor = result.browser.major || browserVersion.split('.')[0] || '';

  const osName = result.os.name || 'Unknown OS';
  const osVersion = result.os.version || '';

  const rawDeviceType = result.device.type; // 'mobile', 'tablet', undefined/console/smarttv
  const vendor = result.device.vendor || '';
  const model = result.device.model || '';

  let isMobile = false;
  let isTablet = false;
  let isDesktop = false;
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';

  // Check device type from UAParser & heuristics for Android/iOS
  const lowerUa = normalized.toLowerCase();
  const lowerOs = osName.toLowerCase();

  if (rawDeviceType === 'tablet' || lowerUa.includes('tablet') || lowerUa.includes('ipad')) {
    isTablet = true;
    deviceType = 'tablet';
  } else if (
    rawDeviceType === 'mobile' ||
    lowerOs.includes('android') && lowerUa.includes('mobile') ||
    lowerOs.includes('ios') ||
    lowerUa.includes('iphone')
  ) {
    isMobile = true;
    deviceType = 'mobile';
  } else if (lowerOs.includes('android') && !lowerUa.includes('mobile')) {
    // Android without Mobile keyword is typically a tablet
    isTablet = true;
    deviceType = 'tablet';
  } else {
    isDesktop = true;
    deviceType = 'desktop';
  }

  // Completeness score: check if browser, version, OS, OS version, engine are identified
  let completenessPoints = 0;
  if (result.browser.name) completenessPoints += 25;
  if (result.browser.version) completenessPoints += 20;
  if (result.os.name) completenessPoints += 25;
  if (result.os.version) completenessPoints += 15;
  if (result.engine.name) completenessPoints += 15;

  return {
    raw: uaString,
    normalized,
    browser: {
      name: browserName,
      version: browserVersion,
      major: browserMajor,
    },
    os: {
      name: osName,
      version: osVersion,
    },
    device: {
      type: deviceType,
      vendor,
      model,
    },
    flags: {
      isMobile,
      isTablet,
      isDesktop,
    },
    country: detectCountry(normalized, countryHint),
    parserCompleteness: completenessPoints,
  };
}
