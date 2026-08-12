import { useEffect } from 'react';

/**
 * Closes a sheet on Escape.
 *
 * Every overlay in the app is a `fixed inset-0` div that closes when you click
 * the backdrop, which is fine with a pointer and nothing at all without one:
 * on a keyboard the only way out was to tab to the × button, past every link in
 * the sheet. Escape is what people press, and what assistive tech documents.
 *
 * The listener goes on `document` rather than the sheet so it works no matter
 * where focus sits — including before the user has touched anything.
 */
export function useEscapeKey(onEscape: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onEscape, active]);
}
