export interface DatasetItem {
  ua: string;
  platform: 'Android' | 'iOS' | 'Windows' | 'macOS' | 'Linux';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Samsung Internet' | 'Opera';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  weight?: number;
  countryCode?: string;
  countryName?: string;
}

export const REAL_WORLD_DATASET: DatasetItem[] = [
  // ==================== UNITED STATES (USA) ====================
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Windows',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 100,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'macOS',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 100,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    platform: 'Windows',
    browser: 'Edge',
    deviceType: 'desktop',
    weight: 98,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    platform: 'macOS',
    browser: 'Safari',
    deviceType: 'desktop',
    weight: 100,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
    platform: 'Windows',
    browser: 'Firefox',
    deviceType: 'desktop',
    weight: 96,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X; en-US) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    browser: 'Safari',
    deviceType: 'mobile',
    weight: 100,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro Build/AP2A.240905.003; en-US) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.6778.135 Mobile Safari/537.36',
    platform: 'Android',
    browser: 'Chrome',
    deviceType: 'mobile',
    weight: 100,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S928U Build/UP1A.231005.007; en-US) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.107 Mobile Safari/537.36',
    platform: 'Android',
    browser: 'Chrome',
    deviceType: 'mobile',
    weight: 98,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S921U Build/UP1A.231005.007; en-US) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.6261.119 Mobile Safari/537.36',
    platform: 'Android',
    browser: 'Samsung Internet',
    deviceType: 'mobile',
    weight: 95,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (iPad; CPU OS 18_1 like Mac OS X; en-US) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    browser: 'Safari',
    deviceType: 'tablet',
    weight: 96,
    countryCode: 'US',
    countryName: 'United States',
  },

  // ==================== UNITED KINGDOM (UK / GB) ====================
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0; en-GB) Gecko/20100101 Firefox/133.0',
    platform: 'Windows',
    browser: 'Firefox',
    deviceType: 'desktop',
    weight: 98,
    countryCode: 'GB',
    countryName: 'United Kingdom',
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 (en-GB)',
    platform: 'macOS',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 98,
    countryCode: 'GB',
    countryName: 'United Kingdom',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X; en-GB) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    browser: 'Safari',
    deviceType: 'mobile',
    weight: 98,
    countryCode: 'GB',
    countryName: 'United Kingdom',
  },
  {
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S928B Build/UP1A.231005.007; en-GB) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.107 Mobile Safari/537.36',
    platform: 'Android',
    browser: 'Chrome',
    deviceType: 'mobile',
    weight: 96,
    countryCode: 'GB',
    countryName: 'United Kingdom',
  },

  // ==================== CANADA (CA) ====================
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 (en-CA)',
    platform: 'Windows',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 96,
    countryCode: 'CA',
    countryName: 'Canada',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X; en-CA) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    browser: 'Safari',
    deviceType: 'mobile',
    weight: 96,
    countryCode: 'CA',
    countryName: 'Canada',
  },

  // ==================== GERMANY (DE) ====================
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; de-DE) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Windows',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 98,
    countryCode: 'DE',
    countryName: 'Germany',
  },
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0; de-DE) Gecko/20100101 Firefox/133.0',
    platform: 'Windows',
    browser: 'Firefox',
    deviceType: 'desktop',
    weight: 96,
    countryCode: 'DE',
    countryName: 'Germany',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X; de-DE) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    browser: 'Safari',
    deviceType: 'mobile',
    weight: 96,
    countryCode: 'DE',
    countryName: 'Germany',
  },

  // ==================== FRANCE (FR) ====================
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; fr-FR) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Windows',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 96,
    countryCode: 'FR',
    countryName: 'France',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X; fr-FR) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    browser: 'Safari',
    deviceType: 'mobile',
    weight: 96,
    countryCode: 'FR',
    countryName: 'France',
  },

  // ==================== JAPAN (JP) ====================
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; ja-JP) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Windows',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 98,
    countryCode: 'JP',
    countryName: 'Japan',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X; ja-JP) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    browser: 'Safari',
    deviceType: 'mobile',
    weight: 98,
    countryCode: 'JP',
    countryName: 'Japan',
  },

  // ==================== AUSTRALIA (AU) ====================
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; en-AU) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Windows',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 96,
    countryCode: 'AU',
    countryName: 'Australia',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X; en-AU) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    platform: 'iOS',
    browser: 'Safari',
    deviceType: 'mobile',
    weight: 96,
    countryCode: 'AU',
    countryName: 'Australia',
  },

  // ==================== INDIA (IN) ====================
  {
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; en-IN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.102 Mobile Safari/537.36',
    platform: 'Android',
    browser: 'Chrome',
    deviceType: 'mobile',
    weight: 94,
    countryCode: 'IN',
    countryName: 'India',
  },

  // ==================== BRAZIL (BR) ====================
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; pt-BR) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Windows',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 94,
    countryCode: 'BR',
    countryName: 'Brazil',
  },

  // ==================== LINUX DESKTOP ====================
  {
    ua: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    platform: 'Linux',
    browser: 'Chrome',
    deviceType: 'desktop',
    weight: 94,
    countryCode: 'US',
    countryName: 'United States',
  },
  {
    ua: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
    platform: 'Linux',
    browser: 'Firefox',
    deviceType: 'desktop',
    weight: 92,
    countryCode: 'US',
    countryName: 'United States',
  },
  // FACEBOOK IN-APP BROWSERS
  {
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S928B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/122.0.6261.119 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/456.0.0.39.90;]',
    weight: 100,
    platform: 'Android',
    browser: 'Facebook',
    deviceType: 'mobile',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21E236 [FBAN/FBIOS;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.4.1;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]',
    weight: 95,
    platform: 'iOS',
    browser: 'Facebook',
    deviceType: 'mobile',
  },
  {
    ua: 'Mozilla/5.0 (Linux; Android 13; SM-A546B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.210 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/448.0.0.33.108;]',
    weight: 85,
    platform: 'Android',
    browser: 'Facebook',
    deviceType: 'mobile',
  },
  {
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/20G75 [FBAN/FBIOS;FBDV/iPhone13,2;FBMD/iPhone;FBSN/iOS;FBSV/16.6;FBSS/3;FBID/phone;FBLC/en_GB;FBOP/5]',
    weight: 80,
    platform: 'iOS',
    browser: 'Facebook',
    deviceType: 'mobile',
  },
  {
    ua: 'Mozilla/5.0 (Linux; Android 12; CPH2213 Build/SP1A.210812.017; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.5993.111 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/439.0.0.43.117;]',
    weight: 75,
    platform: 'Android',
    browser: 'Facebook',
    deviceType: 'mobile',
  },
];
