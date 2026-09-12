export interface ClientHints {
  secChUa: string;
  secChUaMobile: string;
  secChUaPlatform: string;
}

export function generateClientHints(
  browserName: string,
  browserVersion: string,
  osName: string,
  isMobile: boolean,
  rawUa?: string
): ClientHints {
  let majorVersion = browserVersion.split('.')[0] || '100';
  const brands = [
    `"Not(A:Brand";v="99"`, // GREASE
  ];

  const bn = browserName.toLowerCase();
  
  let isFacebook = bn.includes('facebook') || (rawUa && /FBAN|FBAV|FB_IAB/i.test(rawUa));
  let fbEngineMajor = '100';
  
  if (isFacebook && rawUa) {
    // Extract underlying Chrome version for Android WebView
    const chromeMatch = rawUa.match(/Chrome\/([0-9]+)\./);
    if (chromeMatch) fbEngineMajor = chromeMatch[1];
  }

  if (bn.includes('chrome')) {
    brands.push(`"Chromium";v="${majorVersion}"`);
    brands.push(`"Google Chrome";v="${majorVersion}"`);
  } else if (bn.includes('edge')) {
    brands.push(`"Chromium";v="${majorVersion}"`);
    brands.push(`"Microsoft Edge";v="${majorVersion}"`);
  } else if (bn.includes('opera')) {
    brands.push(`"Chromium";v="${majorVersion}"`);
    brands.push(`"Opera";v="${majorVersion}"`);
  } else if (bn.includes('brave')) {
    brands.push(`"Chromium";v="${majorVersion}"`);
    brands.push(`"Brave";v="${majorVersion}"`);
  } else if (isFacebook) {
    if (osName.toLowerCase().includes('android')) {
      brands.push(`"Chromium";v="${fbEngineMajor}"`);
      brands.push(`"Android WebView";v="${fbEngineMajor}"`);
    } else {
      // iOS doesn't typically send Sec-CH-UA yet, but if forced:
      brands.push(`"WebKit";v="605"`);
      brands.push(`"Safari";v="604"`);
    }
  } else {
    brands.push(`"${browserName}";v="${majorVersion}"`);
  }

  let platform = osName;
  const osL = osName.toLowerCase();
  if (osL.includes('mac')) platform = 'macOS';
  else if (osL.includes('win')) platform = 'Windows';
  else if (osL.includes('android')) platform = 'Android';
  else if (osL.includes('ios')) platform = 'iOS';
  else if (osL.includes('linux')) platform = 'Linux';
  else if (osL.includes('cros')) platform = 'Chrome OS';

  return {
    secChUa: brands.join(', '),
    secChUaMobile: isMobile ? '?1' : '?0',
    secChUaPlatform: `"${platform}"`,
  };
}
