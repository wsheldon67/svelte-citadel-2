/**
 * Exception thrown when an invalid action is attempted.
 * Used for comprehensive rule validation system.
 */
export class RuleViolation extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'RuleViolation';
  }
}
