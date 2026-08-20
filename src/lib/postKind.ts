import { Post, PostKind } from '../types';

/**
 * One colour per kind of post, so a thread's sort is read before its words.
 *
 * The feed's four kinds — fråga, tips, diskussion, seger — used to be an emoji
 * on the card and nothing else, and an emoji is the one thing a reader scanning
 * a feed doesn't stop to decode as a category. A coloured rail down the side of
 * a thread does the same job the status colour does on an exam card: it says
 * what kind of thing this is before you've read a letter of it.
 *
 * The palette is the app's own — a question is teal (the brand asking voice),
 * a tip amber (the study-tip colour used on the exam detail), a discussion
 * violet, and a win the trust green that means "done" everywhere else. Kept
 * apart from `examStatusColor` on purpose: these colours answer "what sort of
 * post" and never "can I book this", so sharing a table would let the two
 * meanings drift into each other.
 */
export interface PostKindTone {
  key: PostKind;
  /** The word on the chip and the filter button. */
  label: string;
  /** Plural, for the filter button ("Frågor 4"). */
  pluralLabel: string;
  /** The 4px rail down the left edge of a thread. */
  rail: string;
  /** Tinted chip: coloured text on a soft ground, shown on the thread. */
  softChip: string;
  /** Solid chip: white text on the kind colour, for the active filter button. */
  chip: string;
  /** 8px dot, for compact rows. */
  dot: string;
  /** Legend and filter order. */
  rank: number;
}

export const POST_KIND_TONES: Record<PostKind, PostKindTone> = {
  fråga: {
    key: 'fråga',
    label: 'Fråga',
    pluralLabel: 'Frågor',
    rail: 'bg-brand-500',
    softChip: 'bg-brand-50 text-brand-700',
    chip: 'bg-brand-500 text-white',
    dot: 'bg-brand-500',
    rank: 0,
  },
  tips: {
    key: 'tips',
    label: 'Tips',
    pluralLabel: 'Tips',
    rail: 'bg-amber-accent',
    softChip: 'bg-amber-accent-50 text-amber-accent',
    chip: 'bg-amber-accent text-white',
    dot: 'bg-amber-accent',
    rank: 1,
  },
  diskussion: {
    key: 'diskussion',
    label: 'Diskussion',
    pluralLabel: 'Diskussioner',
    rail: 'bg-violet-ink',
    softChip: 'bg-violet-tint text-violet-ink',
    chip: 'bg-violet-ink text-white',
    dot: 'bg-violet-ink',
    rank: 2,
  },
  seger: {
    key: 'seger',
    label: 'Seger',
    pluralLabel: 'Segrar',
    rail: 'bg-trust-500',
    softChip: 'bg-trust-50 text-trust-700',
    chip: 'bg-trust-500 text-white',
    dot: 'bg-trust-500',
    rank: 3,
  },
};

/** Legend and filter order, sorted once from the table's ranks. */
export const POST_KIND_ORDER: PostKind[] = (Object.keys(POST_KIND_TONES) as PostKind[]).sort(
  (a, b) => POST_KIND_TONES[a].rank - POST_KIND_TONES[b].rank,
);

/**
 * The kind a post is filed under.
 *
 * Older posts, and any created before the composer offered a kind picker, carry
 * no `kind`. Rather than drop them into an uncoloured limbo, they read as a
 * discussion — the most neutral of the four, and the one least likely to
 * mislabel a plain remark as a question, a tip, or a win.
 */
export function postKindOf(post: Post): PostKind {
  return post.kind ?? 'diskussion';
}

export function postKindTone(post: Post): PostKindTone {
  return POST_KIND_TONES[postKindOf(post)];
}

/** How many posts sit in each kind, for the filter buttons' counts. */
export function countByKind(posts: Post[]): Record<PostKind, number> {
  const counts = { fråga: 0, tips: 0, diskussion: 0, seger: 0 } as Record<PostKind, number>;
  for (const post of posts) counts[postKindOf(post)] += 1;
  return counts;
}
