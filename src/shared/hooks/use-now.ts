import { useEffect, useState } from 'react';

/** Current time that re-renders every `intervalMs` (elapsed-time labels, greetings). */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
