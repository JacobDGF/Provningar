/**
 * "3 min sedan" while that's the useful thing to say, a real date once it isn't.
 *
 * Community and Historik each had their own copy of this, and the community's
 * never stopped counting: a thread from the spring read "133d sedan", which
 * says nothing except that the place looks abandoned. Past a week the date
 * itself is both shorter and more informative, so that's where it switches —
 * and once a post is from another year, the year goes back in.
 */
export function timeAgo(dateStr: string, now: number = Date.now()): string {
  const then = new Date(dateStr);
  const diff = now - then.getTime();

  // A future timestamp is a clock skew, not a prediction — don't say "-2d sedan".
  if (diff < 0) return 'Nyss';

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    const sameYear = then.getFullYear() === new Date(now).getFullYear();
    return then.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
      ...(sameYear ? {} : { year: 'numeric' }),
    });
  }
  if (days > 0) return `${days} d sedan`;
  if (hours > 0) return `${hours} h sedan`;
  if (mins > 0) return `${mins} min sedan`;
  return 'Nyss';
}
