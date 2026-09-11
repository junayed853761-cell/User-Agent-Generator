import { ParsedUserAgent } from '../parsers/userAgentParser.js';

export interface CompatibilityCheckResult {
  isValid: boolean;
  status: 'COMPATIBLE' | 'SUSPICIOUS' | 'INCOMPATIBLE' | 'OBSOLETE' | 'MALFORMED';
  checksPassed: string[];
  checksFailed: string[];
  reasons: string[];
  warnings: string[];
}

export class CompatibilityValidator {
  validate(parsed: ParsedUserAgent): CompatibilityCheckResult {
    const passed: string[] = [];
    const failed: string[] = [];
    const reasons: string[] = [];
    const warnings: string[] = [];

    const browserName = parsed.browser.name.toLowerCase();
    const osName = parsed.os.name.toLowerCase();
    const browserMajor = parseInt(parsed.browser.major || '0', 10);
    const osVersionMajor = parseInt(parsed.os.version.split('.')[0] || '0', 10);
    const raw = parsed.normalized;

    let isMalformed = false;
    let isImpossible = false;
    let isSuspicious = false;
    let isObsolete = false;

    // 1. Malformed syntax check
    if (!raw.startsWith('Mozilla/') && !raw.startsWith('Opera/')) {
      failed.push('Missing standard Mozilla/ or Opera/ prefix');
      warnings.push('User-Agent string does not start with a standard token header.');
      isMalformed = true;
    } else {
      passed.push('Standard UA header format');
    }

    const openParenCount = (raw.match(/\(/g) || []).length;
    const closeParenCount = (raw.match(/\)/g) || []).length;
    if (openParenCount !== closeParenCount) {
      failed.push('Unbalanced parentheses in UA string');
      warnings.push('Syntax anomaly: Unbalanced parentheses detected.');
      isMalformed = true;
    } else {
      passed.push('Balanced structural syntax');
    }

    // 2. Impossible OS/Browser combinations
    // Safari on Android or Windows (Safari stopped on Windows at v5.1.7 in 2012)
    if (browserName.includes('safari') && !browserName.includes('chrome')) {
      if (osName.includes('windows') && browserMajor > 5) {
        failed.push('Safari v6+ is impossible on Windows');
        warnings.push('Safari version > 5 is not supported or distributed for Windows.');
        isImpossible = true;
      }
      if (osName.includes('android')) {
        failed.push('Safari is impossible on Android');
        warnings.push('Apple Safari browser does not run natively on Google Android.');
        isImpossible = true;
      }
    }

    // Internet Explorer on Android / iOS / Linux
    if (browserName.includes('internet explorer') || browserName.includes('ie')) {
      if (osName.includes('android') || osName.includes('ios') || osName.includes('linux')) {
        failed.push('Internet Explorer is incompatible with mobile/Linux platforms');
        warnings.push('Internet Explorer only existed on Windows and legacy Mac OS.');
        isImpossible = true;
      }
    }

    // EdgeHTML (Edge < 79) on macOS or Linux or Android
    if (browserName.includes('edge') && browserMajor < 79 && browserMajor > 0) {
      if (osName.includes('mac') || osName.includes('linux')) {
        failed.push('Legacy EdgeHTML is exclusive to Windows 10');
        warnings.push('Pre-Chromium Edge was never released for macOS or Linux.');
        isImpossible = true;
      }
    }

    // Samsung Internet on iOS or Windows
    if (browserName.includes('samsung internet')) {
      if (osName.includes('ios') || osName.includes('mac') || osName.includes('windows')) {
        failed.push('Samsung Internet is primarily exclusive to Android');
        warnings.push('Samsung Internet browser is designed for Android systems.');
        isSuspicious = true;
      }
    }

    // 3. Obsolete combinations check
    // Very old Android with ultra-modern Chrome (e.g. Android 4.x / 5.x with Chrome 120+)
    if (osName.includes('android') && osVersionMajor > 0 && osVersionMajor < 6 && browserMajor > 100) {
      failed.push('Modern Chrome version running on obsolete Android OS');
      warnings.push(`Chrome ${browserMajor} cannot run on Android ${osVersionMajor}; Chrome dropped support.`);
      isObsolete = true;
    }

    // Very old iOS with modern Safari
    if (osName.includes('ios') && osVersionMajor > 0 && osVersionMajor < 12 && browserMajor > 16) {
      failed.push('Modern Safari version on legacy iOS OS');
      warnings.push(`Safari ${browserMajor} is coupled to modern iOS versions.`);
      isObsolete = true;
    }

    // 4. Device consistency check
    if (parsed.flags.isMobile && (osName.includes('windows') && !raw.includes('Windows Phone'))) {
      // Chrome Mobile on standard Windows NT
      if (raw.includes('Mobile') && raw.includes('Windows NT')) {
        failed.push('Desktop Windows NT claiming Mobile UA token');
        warnings.push('Suspicious Mobile token within Windows NT desktop User-Agent.');
        isSuspicious = true;
      }
    }

    if (failed.length === 0) {
      passed.push('Browser and OS platform compatibility verified');
      reasons.push('Browser/OS combination is compatible');
      reasons.push('Parser successfully recognized all platform tokens');
    }

    let status: CompatibilityCheckResult['status'] = 'COMPATIBLE';
    if (isMalformed) status = 'MALFORMED';
    else if (isImpossible) status = 'INCOMPATIBLE';
    else if (isObsolete) status = 'OBSOLETE';
    else if (isSuspicious) status = 'SUSPICIOUS';

    return {
      isValid: status === 'COMPATIBLE' || status === 'SUSPICIOUS',
      status,
      checksPassed: passed,
      checksFailed: failed,
      reasons,
      warnings,
    };
  }
}
