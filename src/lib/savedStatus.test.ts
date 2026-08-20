import { describe, it, expect } from 'vitest';
import { Exam } from '../types';
import { summarizeSavedStatus } from './savedStatus';

/** A minimal exam whose status is driven entirely by its nextPeriod. */
function makeExam(period: Partial<Exam['nextPeriod']>): Exam {
  return {
    id: 'x',
    schoolName: 'Test',
    provider: 'Test',
    subject: 'Matematik',
    course: 'Matematik 2b',
    courseCode: 'MATMAT02b',
    level: 'Komvux',
    city: 'Stockholm',
    region: 'Stockholm',
    address: 'Test',
    lat: 59,
    lng: 18,
    price: 500,
    nextPeriod: { label: 'p', confirmed: true, ...period },
    components: [],
    studyTips: [],
    registrationUrl: 'https://example.se/anmalan',
    infoUrl: 'https://example.se/',
    description: '',
    tags: [],
    verifiedAt: '2026-08-01',
  };
}

const iso = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

describe('summarizeSavedStatus', () => {
  it('is empty for no saved exams', () => {
    const s = summarizeSavedStatus([]);
    expect(s.total).toBe(0);
    expect(s.actionable).toBe(0);
    expect(s.buckets).toEqual([]);
  });

  it('counts a full round as not actionable, even with open-looking dates', () => {
    const full = makeExam({
      applicationStart: iso(-5),
      applicationEnd: iso(10),
      full: true,
    });
    const s = summarizeSavedStatus([full]);
    expect(s.total).toBe(1);
    expect(s.actionable).toBe(0);
    expect(s.buckets[0].tone.key).toBe('full');
  });

  it('counts open and closing-soon rounds as actionable', () => {
    const openWide = makeExam({ applicationStart: iso(-2), applicationEnd: iso(20) });
    const closingSoon = makeExam({ applicationStart: iso(-2), applicationEnd: iso(3) });
    const s = summarizeSavedStatus([openWide, closingSoon]);
    expect(s.actionable).toBe(2);
  });

  it('counts an upcoming dated round as actionable', () => {
    const upcoming = makeExam({ applicationStart: iso(10), applicationEnd: iso(30) });
    const s = summarizeSavedStatus([upcoming]);
    expect(s.actionable).toBe(1);
    expect(s.buckets[0].tone.key).toBe('upcoming');
  });

  it('does not count a closed round as actionable', () => {
    const closed = makeExam({ applicationStart: iso(-30), applicationEnd: iso(-5) });
    const s = summarizeSavedStatus([closed]);
    expect(s.actionable).toBe(0);
    expect(s.buckets[0].tone.key).toBe('closed');
  });

  it('lists buckets in legend order and only when non-empty', () => {
    const full = makeExam({ applicationEnd: iso(10), full: true });
    const open = makeExam({ applicationStart: iso(-2), applicationEnd: iso(20) });
    const s = summarizeSavedStatus([open, full]);
    // full ranks before open in the legend, regardless of input order.
    expect(s.buckets.map((b) => b.tone.key)).toEqual(['full', 'open']);
  });

  it('bucket counts sum to the total', () => {
    const exams = [
      makeExam({ applicationEnd: iso(10), full: true }),
      makeExam({ applicationStart: iso(-2), applicationEnd: iso(20) }),
      makeExam({ applicationStart: iso(-30), applicationEnd: iso(-5) }),
    ];
    const s = summarizeSavedStatus(exams);
    const sum = s.buckets.reduce((a, b) => a + b.count, 0);
    expect(sum).toBe(s.total);
    expect(s.total).toBe(3);
  });
});
