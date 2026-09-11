import { CompatibilityValidator, CompatibilityCheckResult } from '../validators/compatibilityValidator.js';
import { SourceValidator, SourceValidationResult } from '../validators/sourceValidator.js';
import { ParsedUserAgent } from '../parsers/userAgentParser.js';

export class ValidationService {
  private compatibilityValidator: CompatibilityValidator;
  private sourceValidator: SourceValidator;

  constructor() {
    this.compatibilityValidator = new CompatibilityValidator();
    this.sourceValidator = new SourceValidator();
  }

  validateCompatibility(parsed: ParsedUserAgent): CompatibilityCheckResult {
    return this.compatibilityValidator.validate(parsed);
  }

  validateRawSource(raw: any): SourceValidationResult {
    return this.sourceValidator.validateRawUserAgent(raw);
  }
}
