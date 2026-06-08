import { getPlatformFeePercent } from './platform-fee.util';

describe('platform-fee.util', () => {
  describe('Individual Plans', () => {
    it('should return 5% for amounts between $1,000 and $9,999.99', () => {
      expect(getPlatformFeePercent('INDIVIDUAL', 1000)).toBe(5);
      expect(getPlatformFeePercent('INDIVIDUAL', 5000)).toBe(5);
      expect(getPlatformFeePercent('INDIVIDUAL', 9999.99)).toBe(5);
    });

    it('should return 4% for amounts of $10,000 and above', () => {
      expect(getPlatformFeePercent('INDIVIDUAL', 10000)).toBe(4);
      expect(getPlatformFeePercent('INDIVIDUAL', 50000)).toBe(4);
    });

    it('should handle variations in case and plan name matching', () => {
      expect(getPlatformFeePercent('Individual Plan', 1000)).toBe(5);
      expect(getPlatformFeePercent('INDIVIDUAL PLAN', 10000)).toBe(4);
    });
  });

  describe('Club Plans', () => {
    it('should return 5% for amounts between $10 and $100', () => {
      expect(getPlatformFeePercent('CLUB', 10)).toBe(5);
      expect(getPlatformFeePercent('CLUB', 50)).toBe(5);
      expect(getPlatformFeePercent('CLUB', 100)).toBe(5);
    });

    it('should return 4% for amounts above $100', () => {
      expect(getPlatformFeePercent('CLUB', 100.01)).toBe(4);
      expect(getPlatformFeePercent('CLUB', 500)).toBe(4);
    });

    it('should handle variations in case and plan name matching', () => {
      expect(getPlatformFeePercent('Club Plan', 50)).toBe(5);
      expect(getPlatformFeePercent('CLUB PLAN', 500)).toBe(4);
    });
  });

  describe('Fallback/Defaults', () => {
    it('should return 5% default for invalid/null/undefined or unknown plans', () => {
      expect(getPlatformFeePercent(null, 50)).toBe(5);
      expect(getPlatformFeePercent(undefined, 500)).toBe(5);
      expect(getPlatformFeePercent('UNKNOWN_PLAN', 5000)).toBe(5);
    });
  });
});
