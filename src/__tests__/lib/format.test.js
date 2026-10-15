import { describe, it, expect } from 'vitest';
import {
  formatInt,
  formatDecimal,
  formatPercent,
  formatCompact,
  formatDate,
} from '../../lib/format';
import { cn } from '../../lib/cn';

describe('Formatters (src/lib/format.js)', () => {
  it('formatInt should format numbers with thousand separators', () => {
    expect(formatInt(14141)).toBe('14.141');
    expect(formatInt('14141')).toBe('14.141');
    expect(formatInt(0)).toBe('0');
  });

  it('formatInt should return — for null, undefined or NaN', () => {
    expect(formatInt(null)).toBe('—');
    expect(formatInt(undefined)).toBe('—');
    expect(formatInt(NaN)).toBe('—');
    expect(formatInt('')).toBe('—');
    expect(formatInt('abc')).toBe('—');
  });

  it('formatDecimal should format decimal numbers in pt-BR', () => {
    expect(formatDecimal(14.141, 1)).toBe('14,1');
    expect(formatDecimal(14.141, 2)).toBe('14,14');
    expect(formatDecimal(0, 1)).toBe('0,0');
  });

  it('formatDecimal should return — for invalid values', () => {
    expect(formatDecimal(null)).toBe('—');
    expect(formatDecimal(undefined)).toBe('—');
    expect(formatDecimal(NaN)).toBe('—');
  });

  it('formatPercent should format percentage in pt-BR', () => {
    expect(formatPercent(15.4)).toBe('15,4%');
    expect(formatPercent(100, 0)).toBe('100%');
    expect(formatPercent(0.154, 1, { isFraction: true })).toBe('15,4%');
  });

  it('formatPercent should return — for invalid values', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
    expect(formatPercent(NaN)).toBe('—');
  });

  it('formatCompact should format numbers in compact notation', () => {
    expect(formatCompact(14141)).toMatch(/14,1\s?mil/);
    expect(formatCompact(1200000)).toMatch(/1,2\s?mi/);
  });

  it('formatCompact should return — for invalid values', () => {
    expect(formatCompact(null)).toBe('—');
    expect(formatCompact(undefined)).toBe('—');
    expect(formatCompact(NaN)).toBe('—');
  });

  it('formatDate should format valid dates as dd/mm/aaaa', () => {
    const formatted = formatDate('2024-05-18T12:00:00Z');
    expect(formatted).toBe('18/05/2024');
  });

  it('formatDate should return — for invalid dates', () => {
    expect(formatDate('data-invalida')).toBe('—');
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});

describe('Classnames utility (src/lib/cn.js)', () => {
  it('cn should merge class strings and conditionals', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible');
    expect(cn('a', null, undefined, { b: true, c: false })).toBe('a b');
  });
});
