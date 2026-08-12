/**
 * Profile pictures are yours or nobody's.
 *
 * The app used to ship stock photographs of strangers — a pravatar face on every
 * seeded community post and eight of them in the profile picker. On a product
 * whose entire pitch is "these facts are checked", a photo of a person who does
 * not exist attached to advice about a real prövning is the one thing on screen
 * that is a lie. So there is exactly one source of a face here: a photo the user
 * takes or picks themselves, which lives in their own browser and never leaves
 * it. Everyone else gets a drawn monogram.
 *
 * That means the only avatars we render are locally-produced ones — `data:` from
 * a file/camera input, or `blob:` from an object URL. Remote URLs are refused
 * rather than trusted, which also cleans out the stock faces still sitting in
 * returning users' localStorage from before this change.
 */

/** True when `src` is a picture the user themselves supplied on this device. */
export function isOwnPhoto(src: string | undefined | null): boolean {
  if (!src) return false;
  return src.startsWith('data:image/') || src.startsWith('blob:');
}

/** Largest edge of a stored avatar, in px. Keeps localStorage from filling up
    with an 8 MP camera capture — the biggest we ever draw one is 96px. */
export const AVATAR_MAX_EDGE = 320;

/** Up to two initials, from a display name of any shape. */
export function initialsOf(name: string): string {
  const words = name
    .split(/[\s–—-]+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Palette for drawn monograms — the design system's ink pairs, no new colors. */
const MONOGRAM_INKS: [string, string][] = [
  ['#0A303E', '#1186AC'],
  ['#790E3D', '#D6006C'],
  ['#1D5537', '#2F8457'],
  ['#004961', '#38A6CF'],
  ['#5B3A0B', '#B8860B'],
  ['#4A2B4E', '#AA0B56'],
  ['#201E1D', '#0088B0'],
  ['#256B46', '#62C5EE'],
];

/** Stable per identity, so the same person keeps the same monogram everywhere. */
export function monogramInk(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return MONOGRAM_INKS[hash % MONOGRAM_INKS.length];
}

/**
 * Downscales a picked image to `AVATAR_MAX_EDGE` and returns a JPEG data URL.
 *
 * Phone cameras hand us 3–8 MB files and `localStorage` has a ~5 MB budget for
 * the *whole app*, so storing the original would break saving a prövning — a
 * failure that would surface far away from the profile screen that caused it.
 */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Bilden kunde inte läsas.'));
      el.src = bitmapUrl;
    });

    const edge = Math.min(AVATAR_MAX_EDGE, Math.max(img.width, img.height));
    const scale = edge / Math.max(img.width, img.height);
    // Square crop from the centre — avatars are always drawn in a circle, so
    // letterboxing a portrait photo would just add bars nobody asked for.
    const side = Math.round(Math.min(img.width, img.height) * scale);
    const canvas = document.createElement('canvas');
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Kunde inte bearbeta bilden i den här webbläsaren.');
    const sourceSide = Math.min(img.width, img.height);
    ctx.drawImage(
      img,
      (img.width - sourceSide) / 2,
      (img.height - sourceSide) / 2,
      sourceSide,
      sourceSide,
      0,
      0,
      side,
      side,
    );
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}
