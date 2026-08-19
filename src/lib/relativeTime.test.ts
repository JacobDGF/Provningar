import { describe, it, expect } from 'vitest';
import { timeAgo } from './relativeTime';

const NOW = new Date('2026-08-15T12:00:00Z').getTime();

describe('timeAgo', () => {
  it('counts minutes and hours while that is the useful answer', () => {
    expect(timeAgo('2026-08-15T11:58:00Z', NOW)).toBe('2 min sedan');
    expect(timeAgo('2026-08-15T09:00:00Z', NOW)).toBe('3 h sedan');
    expect(timeAgo('2026-08-13T12:00:00Z', NOW)).toBe('2 d sedan');
  });

  it('switches to a date past a week rather than counting to 133', () => {
    expect(timeAgo('2026-04-03T12:00:00Z', NOW)).toBe('3 apr.');
  });

  it('keeps the year when the post is from another one', () => {
    expect(timeAgo('2025-11-02T12:00:00Z', NOW)).toMatch(/2025/);
  });

  it('reads a future timestamp as now instead of counting backwards', () => {
    expect(timeAgo('2026-08-16T12:00:00Z', NOW)).toBe('Nyss');
  });
});
