import { useEffect, useState } from 'react';

const CHECK_INTERVAL_MS = 60_000;

/** Polls version.json (no-store) and flips to true when the deployed build
    differs from the one currently running — GitHub Pages can't set custom
    Cache-Control headers, so this replaces relying on HTTP cache expiry. */
export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.buildId && data.buildId !== __BUILD_ID__) {
          setUpdateAvailable(true);
        }
      } catch {
        // Offline or blocked — ignore, try again next interval.
      }
    };

    check();
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, []);

  return updateAvailable;
}
