import { isOwnPhoto, initialsOf, monogramInk } from '../lib/avatar';

interface Props {
  name: string;
  /** Only rendered when it's a photo this user supplied themselves. */
  src?: string;
  /** Kept stable across renames so a monogram doesn't change color mid-thread. */
  seed?: string;
  /** Rendered size in px. */
  size?: number;
  className?: string;
}

/**
 * A face, or a drawn monogram — never a stock photo of a stranger.
 *
 * See `lib/avatar.ts` for why remote image URLs are refused rather than shown.
 */
export function Avatar({ name, src, seed, size = 40, className = '' }: Props) {
  const showPhoto = isOwnPhoto(src);
  const [from, to] = monogramInk(seed || name);

  if (showPhoto) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover flex-shrink-0 bg-sand ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        // Tracks the circle so the monogram stays optically centred at 28px and 96px alike.
        fontSize: Math.round(size * 0.4),
      }}
      className={`rounded-full flex-shrink-0 inline-flex items-center justify-center text-white font-display font-bold leading-none select-none ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}
