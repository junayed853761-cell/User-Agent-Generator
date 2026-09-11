export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRY_MAP: Record<string, CountryInfo> = {
  US: { code: 'US', name: 'United States', flag: '🇺🇸' },
  GB: { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  CA: { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  DE: { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  FR: { code: 'FR', name: 'France', flag: '🇫🇷' },
  JP: { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  AU: { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  IN: { code: 'IN', name: 'India', flag: '🇮🇳' },
  BR: { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  NL: { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  ES: { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  IT: { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  KR: { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  CN: { code: 'CN', name: 'China', flag: '🇨🇳' },
  RU: { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  SE: { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  MX: { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
};

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  COUNTRY_MAP.US,
  COUNTRY_MAP.GB,
  COUNTRY_MAP.CA,
  COUNTRY_MAP.DE,
  COUNTRY_MAP.FR,
  COUNTRY_MAP.JP,
  COUNTRY_MAP.AU,
  COUNTRY_MAP.IN,
  COUNTRY_MAP.BR,
  COUNTRY_MAP.NL,
  COUNTRY_MAP.ES,
  COUNTRY_MAP.IT,
  COUNTRY_MAP.KR,
  COUNTRY_MAP.CN,
];

export function detectCountry(userAgent: string, hint?: string): CountryInfo {
  if (hint && typeof hint === 'string') {
    const h = hint.toUpperCase().trim();
    if (COUNTRY_MAP[h]) {
      return COUNTRY_MAP[h];
    }
    const lowerHint = hint.toLowerCase();
    for (const [code, info] of Object.entries(COUNTRY_MAP)) {
      if (lowerHint.includes(code.toLowerCase()) || lowerHint.includes(info.name.toLowerCase())) {
        return info;
      }
    }
  }

  if (!userAgent || typeof userAgent !== 'string') {
    return COUNTRY_MAP.US;
  }

  const str = userAgent.toLowerCase();

  // 1. Explicit locale matches in UA comments/tags
  if (str.includes('en-us') || str.includes('en_us') || str.includes('; usa') || str.includes('; us;')) {
    return COUNTRY_MAP.US;
  }
  if (str.includes('en-gb') || str.includes('en_gb') || str.includes('; uk;') || str.includes('; gbr;')) {
    return COUNTRY_MAP.GB;
  }
  if (str.includes('en-ca') || str.includes('fr-ca') || str.includes('en_ca') || str.includes('fr_ca')) {
    return COUNTRY_MAP.CA;
  }
  if (str.includes('de-de') || str.includes('de_de') || str.includes('; de;') || str.includes('; deu;')) {
    return COUNTRY_MAP.DE;
  }
  if (str.includes('fr-fr') || str.includes('fr_fr') || str.includes('; fr;') || str.includes('; fra;')) {
    return COUNTRY_MAP.FR;
  }
  if (str.includes('ja-jp') || str.includes('ja_jp') || str.includes('; jp;') || str.includes('; jpn;')) {
    return COUNTRY_MAP.JP;
  }
  if (str.includes('zh-cn') || str.includes('zh_cn') || str.includes('; cn;')) {
    return COUNTRY_MAP.CN;
  }
  if (str.includes('en-au') || str.includes('en_au') || str.includes('; au;')) {
    return COUNTRY_MAP.AU;
  }
  if (str.includes('en-in') || str.includes('hi-in') || str.includes('en_in') || str.includes('hi_in')) {
    return COUNTRY_MAP.IN;
  }
  if (str.includes('pt-br') || str.includes('pt_br') || str.includes('; br;')) {
    return COUNTRY_MAP.BR;
  }
  if (str.includes('es-es') || str.includes('es_es') || str.includes('; es;')) {
    return COUNTRY_MAP.ES;
  }
  if (str.includes('it-it') || str.includes('it_it') || str.includes('; it;')) {
    return COUNTRY_MAP.IT;
  }
  if (str.includes('ko-kr') || str.includes('ko_kr') || str.includes('; kr;')) {
    return COUNTRY_MAP.KR;
  }
  if (str.includes('nl-nl') || str.includes('nl_nl') || str.includes('; nl;')) {
    return COUNTRY_MAP.NL;
  }
  if (str.includes('ru-ru') || str.includes('ru_ru') || str.includes('; ru;')) {
    return COUNTRY_MAP.RU;
  }
  if (str.includes('es-mx') || str.includes('es_mx') || str.includes('; mx;')) {
    return COUNTRY_MAP.MX;
  }

  // 2. Hardware / Carrier US models (e.g. Samsung Galaxy US models end in 'U' or 'U1')
  if (/\bsm-[a-z0-9]+u1?\b/i.test(userAgent)) {
    return COUNTRY_MAP.US;
  }

  // 3. Pixel Android US builds (AP2A, UD1A, TQ3A, etc.)
  if (/pixel\s+[0-9a-z\s]+build\/(ap2a|ud1a|tq3a|up1a)/i.test(userAgent)) {
    return COUNTRY_MAP.US;
  }

  // 4. Default for standard Western / North American baseline
  return COUNTRY_MAP.US;
}

export function getCountryByCode(code?: string | null): CountryInfo {
  if (!code) return COUNTRY_MAP.US;
  const upper = code.toUpperCase();
  return COUNTRY_MAP[upper] || { code: upper, name: upper, flag: '🌐' };
}
