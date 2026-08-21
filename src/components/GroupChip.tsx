import { GroupStatus } from '../lib/groupStatus';

interface GroupChipProps {
  label: string;
  /** The group behind this chip, or undefined when the dataset has none. */
  status: GroupStatus | undefined;
  active: boolean;
  onClick: () => void;
  /** `pill` for the chip rows under the map, `block` for the filter sheet's grid. */
  variant?: 'pill' | 'block';
}

/**
 * A filter chip that shows what is behind it before you press it.
 *
 * The colour is the group's best listing (see `groupStatus`), so green means
 * "something here is bookable today" rather than "everything here is". The
 * count next to it is how many listings the click leads to, which is the other
 * half of the same question: a chip that opens onto one closed listing and a
 * chip that opens onto twenty open ones looked identical before.
 *
 * Selection is carried by weight, not by hue — a picked chip goes solid in its
 * own colour instead of turning brand-blue. Two meanings in one colour channel
 * is how "Skåne, selected" and "Skåne, open for booking" become the same
 * pixel, and then neither is readable.
 */
export function GroupChip({ label, status, active, onClick, variant = 'pill' }: GroupChipProps) {
  const tone = status?.tone;

  const shape =
    variant === 'pill'
      ? 'rounded-full px-[18px] py-2.5 text-[13.5px] transition-transform hover:-translate-y-0.5'
      : 'rounded px-3 py-2.5 text-sm justify-center transition-colors';

  // An empty group keeps the old neutral chip: there is no status to show, and
  // a grey swatch invented for it would read as "closed".
  const skin = !tone
    ? active
      ? 'bg-ink text-cream'
      : 'bg-cream text-ink-soft border-[1.5px] border-line hover:border-ink'
    : active
      ? tone.chip
      : tone.softChip;

  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      title={tone ? `${label}: ${tone.meaning}` : label}
      className={`inline-flex items-center gap-1.5 font-bold ${shape} ${skin}`}
    >
      {tone && (
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${active ? 'bg-white' : tone.dot}`} />
      )}
      <span className="truncate">{label}</span>
      {status && <span className="tnum opacity-80">({status.count})</span>}
    </button>
  );
}
