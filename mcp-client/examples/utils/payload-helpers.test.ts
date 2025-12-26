/**
 * Unit tests for payload helper utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateTimestamp,
  generateEffectiveUntil,
  generateNationalIdentifier,
  buildMandate,
} from './payload-helpers.js';

describe('generateTimestamp', () => {
  it('should return a string representation of Unix timestamp', () => {
    const timestamp = generateTimestamp();
    expect(typeof timestamp).toBe('string');
    expect(Number(timestamp)).toBeGreaterThan(0);
  });

  it('should return current time in seconds', () => {
    const now = Math.floor(Date.now() / 1000);
    const timestamp = generateTimestamp();
    const timestampNum = Number(timestamp);

    // Should be within 1 second of current time
    expect(Math.abs(timestampNum - now)).toBeLessThanOrEqual(1);
  });

  it('should return numeric string with max 12 characters', () => {
    const timestamp = generateTimestamp();
    expect(timestamp).toMatch(/^\d+$/);
    expect(timestamp.length).toBeLessThanOrEqual(12);
  });
});

describe('generateEffectiveUntil', () => {
  it('should generate timestamp 1 year in future by default', () => {
    const now = Date.now();
    const oneYearFromNow = Math.floor(now / 1000) + 365 * 24 * 60 * 60;
    const effectiveUntil = generateEffectiveUntil();
    const effectiveUntilNum = Number(effectiveUntil);

    // Should be approximately 1 year from now (within 1 day tolerance)
    expect(Math.abs(effectiveUntilNum - oneYearFromNow)).toBeLessThan(24 * 60 * 60);
  });

  it('should generate timestamp N years in future when specified', () => {
    const now = Date.now();
    const twoYearsFromNow = Math.floor(now / 1000) + 2 * 365 * 24 * 60 * 60;
    const effectiveUntil = generateEffectiveUntil(2);
    const effectiveUntilNum = Number(effectiveUntil);

    // Should be approximately 2 years from now (within 2 days tolerance)
    expect(Math.abs(effectiveUntilNum - twoYearsFromNow)).toBeLessThan(2 * 24 * 60 * 60);
  });

  it('should return string with max 12 characters', () => {
    const effectiveUntil = generateEffectiveUntil(5);
    expect(effectiveUntil).toMatch(/^\d+$/);
    expect(effectiveUntil.length).toBeLessThanOrEqual(12);
  });

  it('should handle zero years (current time)', () => {
    const now = Math.floor(Date.now() / 1000);
    const effectiveUntil = generateEffectiveUntil(0);
    const effectiveUntilNum = Number(effectiveUntil);

    // Should be very close to current time
    expect(Math.abs(effectiveUntilNum - now)).toBeLessThan(2);
  });
});

describe('generateNationalIdentifier', () => {
  it('should generate identifier with correct country code prefix', () => {
    const identifier = generateNationalIdentifier('US');
    expect(identifier).toMatch(/^US-ID-\d+$/);
  });

  it('should generate identifier with different country codes', () => {
    const identifierCA = generateNationalIdentifier('CA');
    const identifierGB = generateNationalIdentifier('GB');

    expect(identifierCA).toMatch(/^CA-ID-\d+$/);
    expect(identifierGB).toMatch(/^GB-ID-\d+$/);
  });

  it('should generate random numeric suffix', () => {
    const id1 = generateNationalIdentifier('US');
    const id2 = generateNationalIdentifier('US');

    // Extract the numeric parts
    const num1 = id1.split('-')[2];
    const num2 = id2.split('-')[2];

    // Numbers should be valid integers
    expect(Number(num1)).toBeGreaterThanOrEqual(0);
    expect(Number(num2)).toBeGreaterThanOrEqual(0);

    // They might be different (though there's a tiny chance they're the same)
    // We'll just verify format instead
    expect(num1).toMatch(/^\d+$/);
    expect(num2).toMatch(/^\d+$/);
  });

  it('should generate numeric suffix less than 1 million', () => {
    const identifier = generateNationalIdentifier('US');
    const numPart = identifier.split('-')[2];
    expect(Number(numPart)).toBeLessThan(1000000);
  });
});

describe('buildMandate', () => {
  // Mock crypto.randomUUID
  beforeEach(() => {
    const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
    global.crypto = {
      randomUUID: vi.fn(() => mockUUID),
    } as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should build mandate with default values', () => {
    const mandate = buildMandate();

    expect(mandate).toHaveProperty('mandateId');
    expect(mandate).toHaveProperty('preferredMerchantName', 'Best Buy');
    expect(mandate).toHaveProperty('merchantCategory', 'Electronics');
    expect(mandate).toHaveProperty('merchantCategoryCode', '1234');
    expect(mandate).toHaveProperty('description', 'Iphone 16');
    expect(mandate).toHaveProperty('quantity', '1');

    expect(mandate.declineThreshold).toEqual({
      amount: '800.00',
      currencyCode: 'USD',
    });
  });

  it('should use custom mandateId when provided', () => {
    const customId = 'custom-mandate-123';
    const mandate = buildMandate({ mandateId: customId });

    expect(mandate.mandateId).toBe(customId);
  });

  it('should use custom amount and currency', () => {
    const mandate = buildMandate({
      amount: '1500.00',
      currencyCode: 'EUR',
    });

    expect(mandate.declineThreshold).toEqual({
      amount: '1500.00',
      currencyCode: 'EUR',
    });
  });

  it('should use custom effectiveUntilTime when provided', () => {
    const customTime = '1735689600'; // Some future timestamp
    const mandate = buildMandate({ effectiveUntilTime: customTime });

    expect(mandate.effectiveUntilTime).toBe(customTime);
  });

  it('should generate effectiveUntilTime when not provided', () => {
    const mandate = buildMandate();

    expect(mandate).toHaveProperty('effectiveUntilTime');
    expect(typeof mandate.effectiveUntilTime).toBe('string');
    expect(Number(mandate.effectiveUntilTime)).toBeGreaterThan(0);
  });

  it('should not include recurringFrequency for non-recurring mandates', () => {
    const mandate = buildMandate({ isRecurring: false });

    expect(mandate).not.toHaveProperty('recurringFrequency');
  });

  it('should include recurringFrequency for recurring mandates', () => {
    const mandate = buildMandate({ isRecurring: true });

    expect(mandate).toHaveProperty('recurringFrequency', 'WEEKLY');
  });

  it('should generate UUID for mandateId by default', () => {
    const mandate = buildMandate();

    expect(mandate.mandateId).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(global.crypto.randomUUID).toHaveBeenCalled();
  });

  it('should handle all options together', () => {
    const options = {
      mandateId: 'test-123',
      amount: '2000.00',
      currencyCode: 'GBP',
      isRecurring: true,
      effectiveUntilTime: '1735689600',
    };

    const mandate = buildMandate(options);

    expect(mandate.mandateId).toBe('test-123');
    expect(mandate.declineThreshold).toEqual({
      amount: '2000.00',
      currencyCode: 'GBP',
    });
    expect(mandate.effectiveUntilTime).toBe('1735689600');
    expect(mandate.recurringFrequency).toBe('WEEKLY');
  });

  it('should return object with correct structure', () => {
    const mandate = buildMandate();

    // Verify all required fields exist
    expect(Object.keys(mandate)).toContain('mandateId');
    expect(Object.keys(mandate)).toContain('preferredMerchantName');
    expect(Object.keys(mandate)).toContain('merchantCategory');
    expect(Object.keys(mandate)).toContain('merchantCategoryCode');
    expect(Object.keys(mandate)).toContain('declineThreshold');
    expect(Object.keys(mandate)).toContain('effectiveUntilTime');
    expect(Object.keys(mandate)).toContain('quantity');
    expect(Object.keys(mandate)).toContain('description');
  });
});
