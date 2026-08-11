import { describe, it, expect } from 'vitest';
import { haversineDistanceKm, formatDistanceKm } from './distance';

describe('haversineDistanceKm', () => {
  it('is zero for identical coordinates', () => {
    expect(haversineDistanceKm(59.3293, 18.0686, 59.3293, 18.0686)).toBe(0);
  });

  it('matches the known great-circle distance between Stockholm and Gothenburg (~400km)', () => {
    const km = haversineDistanceKm(59.3293, 18.0686, 57.7089, 11.9746);
    expect(km).toBeGreaterThan(390);
    expect(km).toBeLessThan(410);
  });

  it('is symmetric', () => {
    const ab = haversineDistanceKm(59.3293, 18.0686, 57.7089, 11.9746);
    const ba = haversineDistanceKm(57.7089, 11.9746, 59.3293, 18.0686);
    expect(ab).toBeCloseTo(ba, 10);
  });
});

describe('formatDistanceKm', () => {
  it('shows "<1 km" for sub-kilometer distances', () => {
    expect(formatDistanceKm(0.4)).toBe('<1 km');
  });

  it('shows one decimal place under 10km', () => {
    expect(formatDistanceKm(4.567)).toBe('4.6 km');
  });

  it('rounds to a whole number at 10km and above', () => {
    expect(formatDistanceKm(12.4)).toBe('12 km');
    expect(formatDistanceKm(9.99)).toBe('10.0 km');
  });
});
