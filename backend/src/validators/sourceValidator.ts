export interface SourceValidationResult {
  isValid: boolean;
  errors: string[];
}

export class SourceValidator {
  validateRawUserAgent(raw: any): SourceValidationResult {
    const errors: string[] = [];

    if (!raw) {
      errors.push('Record is null or undefined');
      return { isValid: false, errors };
    }

    const uaString = typeof raw === 'string' ? raw : raw.userAgent || raw.user_agent;
    if (!uaString || typeof uaString !== 'string') {
      errors.push('Missing user agent string in source payload');
      return { isValid: false, errors };
    }

    if (uaString.trim().length < 10) {
      errors.push('User agent string too short to be valid');
    }

    if (uaString.length > 2000) {
      errors.push('User agent string exceeds 2000 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
