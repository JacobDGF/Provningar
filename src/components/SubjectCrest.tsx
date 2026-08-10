import { Exam } from '../types';

/**
 * The card and detail headers used to load a random stock photo from
 * picsum.photos, seeded on the listing id. That was ~100 cross-origin image
 * requests on first paint, and — worse for a product whose whole claim is
 * "these facts are verified" — it showed a photograph of somewhere that is not
 * the school, captioned with the school's name.
 *
 * This draws the header locally instead: a deterministic two-tone field keyed
 * off the subject, with the subject set in the display serif. No network, no
 * layout shift, and it says only things that are true.
 */

/**
 * Stable hue per subject so the same subject always reads the same colour.
 * FNV-1a rather than the usual `h * 31 + c`: 31^k mod 360 cycles with a short
 * period, so short Swedish subject names all collapsed into the same green.
 */
function hueFor(subject: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < subject.length; i++) {
    h ^= subject.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % 360;
}

interface Props {
  exam: Exam;
  className?: string;
  /** Smaller type + no course code, for list thumbnails. */
  compact?: boolean;
}

export function SubjectCrest({ exam, className = '', compact }: Props) {
  const hue = hueFor(exam.subject);
  // Kept dark and low-chroma so the white overlay text stays legible without a
  // scrim, and so 98 of these side by side read as one palette rather than a
  // fruit salad.
  const from = `hsl(${hue} 34% 24%)`;
  const to = `hsl(${(hue + 38) % 360} 40% 15%)`;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      aria-hidden
    >
      {/* Faint rule grid — the newsprint texture of the Broadsheet system. */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0 7px, rgba(255,255,255,.6) 7px 8px)',
        }}
      />
      <span
        className={`font-display absolute select-none leading-none text-white/[0.14] ${
          compact ? 'text-5xl -right-1 -bottom-2' : 'text-[7rem] -right-3 -bottom-6'
        }`}
      >
        {exam.subject.charAt(0).toUpperCase()}
      </span>
      {!compact && (
        <span className="absolute top-3 left-4 text-white/70 text-[11px] font-semibold uppercase tracking-wider">
          {exam.subject}
        </span>
      )}
    </div>
  );
}
