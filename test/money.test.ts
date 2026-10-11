import { describe, expect, it } from 'vitest';
import { amountInWords, formatPkr, numberToWords, roundHalfUp } from '../src/index.js';

describe('formatPkr', () => {
  it('uses international grouping by default', () => {
    expect(formatPkr(1234567.5)).toBe('Rs 1,234,567.50');
    expect(formatPkr(999)).toBe('Rs 999.00');
  });

  it('supports lakh grouping', () => {
    expect(formatPkr(1234567.5, { grouping: 'lakh' })).toBe('Rs 12,34,567.50');
    expect(formatPkr(123456789, { grouping: 'lakh', decimals: 0 })).toBe('Rs 12,34,56,789');
    expect(formatPkr(1000, { grouping: 'lakh', decimals: 0 })).toBe('Rs 1,000');
  });

  it('handles symbols, negatives and rounding', () => {
    expect(formatPkr(-2500, { decimals: 0 })).toBe('-Rs 2,500');
    expect(formatPkr(1.005, { symbol: 'PKR' })).toBe('PKR 1.01');
    expect(formatPkr(-0.001, { symbol: '' })).toBe('0.00');
  });

  it('rejects non numbers', () => {
    expect(() => formatPkr(Number.NaN)).toThrow(RangeError);
  });
});

describe('roundHalfUp', () => {
  it('avoids float surprises', () => {
    expect(roundHalfUp(1.005)).toBe(1.01);
    expect(roundHalfUp(2.675)).toBe(2.68);
    expect(roundHalfUp(-1.005)).toBe(-1.01);
  });
});

describe('numberToWords', () => {
  it.each([
    [0, 'Zero'],
    [7, 'Seven'],
    [15, 'Fifteen'],
    [40, 'Forty'],
    [99, 'Ninety Nine'],
    [100, 'One Hundred'],
    [101, 'One Hundred One'],
    [1000, 'One Thousand'],
    [12_500, 'Twelve Thousand Five Hundred'],
    [100_000, 'One Lakh'],
    [1_250_000, 'Twelve Lakh Fifty Thousand'],
    [10_000_000, 'One Crore'],
    [123_456_789, 'Twelve Crore Thirty Four Lakh Fifty Six Thousand Seven Hundred Eighty Nine'],
    [1_000_000_000, 'One Arab'],
    [250_000_000_000, 'Two Kharab Fifty Arab'],
  ])('lakh system: %d', (n, words) => {
    expect(numberToWords(n)).toBe(words);
  });

  it('repeats the top unit for very large numbers', () => {
    expect(numberToWords(50_000_000_000_000n)).toBe('Five Hundred Kharab');
  });

  it.each([
    [1_000_000, 'One Million'],
    [2_500_000, 'Two Million Five Hundred Thousand'],
    [3_000_000_000, 'Three Billion'],
    [1_234_567, 'One Million Two Hundred Thirty Four Thousand Five Hundred Sixty Seven'],
  ])('international system: %d', (n, words) => {
    expect(numberToWords(n, 'international')).toBe(words);
  });

  it('handles negatives', () => {
    expect(numberToWords(-5)).toBe('Minus Five');
  });
});

describe('amountInWords', () => {
  it('writes cheque style text', () => {
    expect(amountInWords(125050.5)).toBe('Rupees One Lakh Twenty Five Thousand Fifty and Fifty Paisa Only');
    expect(amountInWords(5000)).toBe('Rupees Five Thousand Only');
    expect(amountInWords(0)).toBe('Rupees Zero Only');
  });

  it('writes paisa only amounts without "Rupees"', () => {
    expect(amountInWords(0.75)).toBe('Seventy Five Paisa Only');
  });

  it('rounds to the nearest paisa', () => {
    expect(amountInWords(10.999)).toBe('Rupees Eleven Only');
    expect(amountInWords(10.005)).toBe('Rupees Ten and One Paisa Only');
  });

  it('is configurable', () => {
    expect(amountInWords(2_500_000, { system: 'international' })).toBe('Rupees Two Million Five Hundred Thousand Only');
    expect(amountInWords(99, { currency: '', suffix: '' })).toBe('Ninety Nine');
    expect(amountInWords(-20)).toBe('Minus Rupees Twenty Only');
  });
});
