import { useEffect, useRef, useState, useCallback } from 'react';

// Countdown hook: returns { hh, mm, ss, totalSeconds, isExpired, pct, formatted, formattedFull }
export function useCountdown(expiresAt, totalWindowSeconds) {
  const calc = useCallback(() => {
    const now = Date.now();
    const end = expiresAt ? new Date(expiresAt).getTime() : now;
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

  const maxSeconds = totalWindowSeconds || (4 * 3600);
  const pct = Math.max(0, Math.min(100, (state.totalSeconds / maxSeconds) * 100));

  const formatted = formatCountdown(state.totalSeconds);
  const formattedFull = formatCountdownFull(state.totalSeconds);

  return { ...state, pct, formatted, formattedFull };
}

// Format countdown as "2h 15m" or "45m 30s" or "30s"
export function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00';
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  if (hh > 0) return `${hh}h ${mm}m`;
  if (mm > 0) return `${mm}m ${ss}s`;
  return `${ss}s`;
}

// Format full countdown as "01:24:30" or "45:30"
export function formatCountdownFull(totalSeconds) {
  if (totalSeconds <= 0) return '00:00';
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  if (hh > 0) {
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// Ring color based on percentage or time remaining
export function getRingColor(totalSeconds, pct = null) {
  if (pct !== null) {
    if (pct > 50) return 'green';
    if (pct > 20) return 'amber';
    return 'red';
  }
  if (totalSeconds > 7200) return 'green';   // > 2 hours
  if (totalSeconds > 1800) return 'amber';   // 30m - 2h
  return 'red';                              // < 30m
}

