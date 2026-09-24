import { useEffect, useRef, useState, useCallback } from 'react';

// Countdown hook: returns { hh, mm, ss, totalSeconds, isExpired, pct }
export function useCountdown(expiresAt) {
  const calc = useCallback(() => {
    const now = Date.now();
    const end = new Date(expiresAt).getTime();
    const diff = Math.max(0, end - now);
    const totalSeconds = Math.floor(diff / 1000);
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    return { hh, mm, ss, totalSeconds, isExpired: diff <= 0 };
  }, [expiresAt]);

  const [state, setState] = useState(calc);
  const intervalRef = useRef(null);

  useEffect(() => {
    setState(calc());
    intervalRef.current = setInterval(() => {
      setState(calc());
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [calc]);

  // pct of time remaining relative to 4-hour window
  const WINDOW_HOURS = 4;
  const maxSeconds = WINDOW_HOURS * 3600;
  const pct = Math.min(100, (state.totalSeconds / maxSeconds) * 100);

  return { ...state, pct };
}

// Format countdown as "2h 15m" or "45m 30s" or "< 1m"
export function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return 'Expired';
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  if (hh > 0) return `${hh}h ${mm}m`;
  if (mm > 0) return `${mm}m ${ss}s`;
  return `${ss}s`;
}

// Ring color based on time remaining
export function getRingColor(totalSeconds) {
  if (totalSeconds > 7200) return 'green';   // > 2 hours
  if (totalSeconds > 3600) return 'amber';   // 1-2 hours
  return 'red';                               // < 1 hour
}
