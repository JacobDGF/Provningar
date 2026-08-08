import { useEffect, useState } from 'react';

/** Re-renders the calling component once per minute (and on mount), so all
    Date.now()-based computations — open/closed registration status, deadline
    countdowns, "visad för X min sedan" — stay current in real time without a
    page reload. Data itself refreshes via the version.json update banner. */
export function useMinuteTick(): number {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return tick;
}
