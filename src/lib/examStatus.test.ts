import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isOpenForRegistration, daysUntil } from './examStatus';
import { Exam, NextPeriod } from '../types';

function makeExam(nextPeriod: NextPeriod): Exam {
  return {
    id: 'e1',
    schoolName: 'Test School',
    provider: 'Test kommun',
    schoolImage: '',
    subject: 'Matematik',
    course: 'Matematik 1',
    courseCode: 'MATMAT01',
    level: 'Komvux',
    city: 'Stockholm',
    region: 'Stockholm',
    address: '',
    lat: 0,
    lng: 0,
    price: 500,
    nextPeriod,
    components: [],
    studyTips: [],
    registrationUrl: '',
    infoUrl: '',
    description: '',
    tags: [],
    verifiedAt: '2026-01-01',
  };
}

describe('isOpenForRegistration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is false when the period is not confirmed', () => {
    const exam = makeExam({
      label: 'Höst',
      confirmed: false,
      applicationStart: '2026-06-01',
      applicationEnd: '2026-06-30',
    });
    expect(isOpenForRegistration(exam)).toBe(false);
  });

  it('is false when applicationStart or applicationEnd is missing', () => {
    const exam = makeExam({ label: 'Höst', confirmed: true, applicationEnd: '2026-06-30' });
    expect(isOpenForRegistration(exam)).toBe(false);
  });

  it('is true when today falls within the application window', () => {
    const exam = makeExam({
      label: 'Höst',
      confirmed: true,
      applicationStart: '2026-06-01',
      applicationEnd: '2026-06-30',
    });
    expect(isOpenForRegistration(exam)).toBe(true);
  });

  it('is false before the application window opens', () => {
    const exam = makeExam({
      label: 'Höst',
      confirmed: true,
      applicationStart: '2026-07-01',
      applicationEnd: '2026-07-30',
    });
    expect(isOpenForRegistration(exam)).toBe(false);
  });

  it('is false after the application window closes', () => {
    const exam = makeExam({
      label: 'Vår',
      confirmed: true,
      applicationStart: '2026-01-01',
      applicationEnd: '2026-01-30',
    });
    expect(isOpenForRegistration(exam)).toBe(false);
  });

  it('is inclusive of the exact start and end instants', () => {
    const exam = makeExam({
      label: 'Höst',
      confirmed: true,
      applicationStart: '2026-06-15T12:00:00Z',
      applicationEnd: '2026-06-15T12:00:00Z',
    });
    expect(isOpenForRegistration(exam)).toBe(true);
  });
});

describe('daysUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts whole days to a future date', () => {
    expect(daysUntil('2026-06-20T00:00:00Z')).toBe(5);
  });

  it('returns 0 for today', () => {
    expect(daysUntil('2026-06-15T00:00:00Z')).toBe(0);
  });

  it('returns a negative number for a past date', () => {
    expect(daysUntil('2026-06-10T00:00:00Z')).toBe(-5);
  });

  it('rounds up partial days', () => {
    expect(daysUntil('2026-06-15T01:00:00Z')).toBe(1);
  });
});
