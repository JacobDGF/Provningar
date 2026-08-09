import { Exam } from '../types';

/**
 * The cover art on a listing.
 *
 * Listings used to carry a random picsum.photos URL, which meant a beach photo
 * could head a Malmö chemistry prövning — quietly corrosive on an app whose
 * whole pitch is "these facts are verified". This draws the cover instead:
 * deterministic per listing, on-palette, no network request, no layout shift,
 * and legible whether or not anything else loads.
 */

/** Subject → a stop pair from the design system. Keyed on the first word so
    "Matematik 2b" and "Matematik" land on the same ink. */
const SUBJECT_INK: Record<string, [string, string]> = {
  matematik: ['#0A303E', '#1186AC'],
  fysik: ['#004961', '#38A6CF'],
  kemi: ['#1D5537', '#2F8457'],
  biologi: ['#1D5537', '#62C5EE'],
  naturkunskap: ['#256B46', '#38A6CF'],
  engelska: ['#790E3D', '#D6006C'],
  svenska: ['#201E1D', '#0088B0'],
  'svenska som andraspråk': ['#201E1D', '#1186AC'],
  samhällskunskap: ['#79420E', '#B8860B'],
  historia: ['#5B3A0B', '#B8860B'],
  religionskunskap: ['#4A2B4E', '#AA0B56'],
  psykologi: ['#790E3D', '#FF90B1'],
  företagsekonomi: ['#0A303E', '#2F8457'],
  'vård och omsorg': ['#1D5537', '#0088B0'],
};

const FALLBACK_INK: [string, string] = ['#201E1D', '#0088B0'];

function inkFor(subject: string): [string, string] {
  const key = subject.trim().toLowerCase();
  return SUBJECT_INK[key] ?? SUBJECT_INK[key.split(' ')[0]] ?? FALLBACK_INK;
}

/** Up to two initials from the school name, skipping the filler words that
    every Swedish adult-education provider shares. */
function initials(schoolName: string): string {
  const skip = new Set(['komvux', 'vuxenutbildningen', 'vuxenutbildning', 'i', 'och', 'för', 'kommun', 'stad']);
  const words = schoolName
    .split(/[\s–—-]+/)
    .map(w => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(w => w && !skip.has(w.toLowerCase()));
  const source = words.length ? words : schoolName.split(/\s+/);
  return source.slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

interface Props {
  exam: Exam;
  className?: string;
}

export function SchoolCover({ exam, className = '' }: Props) {
  const [from, to] = inkFor(exam.subject);
  const mark = initials(exam.schoolName);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
      role="img"
      aria-label={`${exam.course} hos ${exam.schoolName}`}
    >
      {/* Newsprint rule pattern — the editorial texture, kept faint enough that
          the overlaid title never has to fight it. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255,255,255,0.9) 0 1px, transparent 1px 14px)',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute -right-3 -top-6 font-display font-bold select-none leading-none text-white/15"
        style={{ fontSize: '9rem' }}
      >
        {mark}
      </span>
      <span
        aria-hidden="true"
        className="absolute left-4 top-4 text-white/80 text-xs font-bold tracking-[0.18em] uppercase"
      >
        {exam.subject}
      </span>
    </div>
  );
}
