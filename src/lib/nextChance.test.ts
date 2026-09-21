import { describe, it, expect, vi, afterEach } from 'vitest';
import { nextChanceFor, nextChanceHeadline } from './nextChance';
import { EXAMS } from '../data/exams';
import { getExamStatus } from './examStatusColor';
import { Exam, NextPeriod } from '../types';

function examWith(nextPeriod: NextPeriod): Exam {
  return { nextPeriod } as Exam;
}

function at(iso: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
}

afterEach(() => vi.useRealTimers());

const CHANCE = { note: 'Nästa anmälan öppnar i början av 2027.' };

describe('nextChanceFor', () => {
  it('visas på en fullbokad omgång', () => {
    at('2026-09-21T09:00:00Z');
    expect(
      nextChanceFor(
        examWith({
          label: '',
          applicationStart: '2026-08-13',
          confirmed: true,
          full: true,
          nextChance: CHANCE,
        }),
      ),
    ).toEqual(CHANCE);
  });

  it('visas på en omgång vars sista anmälningsdag passerat', () => {
    at('2026-09-21T09:00:00Z');
    expect(
      nextChanceFor(
        examWith({
          label: '',
          applicationEnd: '2026-08-20',
          confirmed: true,
          nextChance: CHANCE,
        }),
      ),
    ).toEqual(CHANCE);
  });

  /**
   * En öppen omgång har redan ett svar på frågan "när kan jag anmäla mig?", och
   * det är "nu". En andra, senare möjlighet bredvid den är inte hjälp — den är
   * en ursäkt att vänta.
   */
  it('visas inte medan anmälan är öppen', () => {
    at('2026-09-21T09:00:00Z');
    expect(
      nextChanceFor(
        examWith({
          label: '',
          applicationStart: '2026-09-01',
          applicationEnd: '2026-10-30',
          confirmed: true,
          nextChance: CHANCE,
        }),
      ),
    ).toBeUndefined();
  });

  it('visas inte när anordnaren inte sagt något om nästa omgång', () => {
    at('2026-09-21T09:00:00Z');
    expect(
      nextChanceFor(examWith({ label: '', applicationEnd: '2026-08-20', confirmed: true })),
    ).toBeUndefined();
  });
});

describe('nextChanceHeadline', () => {
  it('nämner inget datum när anordnaren bara sagt en månad', () => {
    expect(nextChanceHeadline(CHANCE)).toBe('Nästa anmälan');
  });

  it('skriver ut dagen när anordnaren publicerat en', () => {
    expect(nextChanceHeadline({ ...CHANCE, opensOn: '2027-01-12' })).toBe(
      'Nästa anmälan öppnar 12 jan.',
    );
  });
});

describe('datan', () => {
  /**
   * Fältet är bara värt något om det sitter där återvändsgränden är. Stockholm
   * är stadens fyra anordnare, och de skriver alla ut nästa omgång i samma
   * mening som de stänger den här.
   */
  it('ger varje stängd Stockholmslistning en nästa chans', () => {
    const stockholm = EXAMS.filter(
      (e) => e.city === 'Stockholm' && ['NTI-skolan', 'Komvux Södermalm'].includes(e.schoolName),
    );
    expect(stockholm.length).toBeGreaterThan(100);
    const blocked = stockholm.filter((e) => ['full', 'closed'].includes(getExamStatus(e).tone.key));
    expect(blocked.length).toBeGreaterThan(0);
    expect(blocked.filter((e) => !nextChanceFor(e)).map((e) => e.id)).toEqual([]);
  });

  it('säger aldrig något om nästa omgång utan anordnarens egna ord', () => {
    const empty = EXAMS.filter(
      (e) => e.nextPeriod.nextChance && !e.nextPeriod.nextChance.note.trim(),
    );
    expect(empty.map((e) => e.id)).toEqual([]);
  });
});
