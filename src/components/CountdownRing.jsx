import { useCountdown, formatCountdown, getRingColor } from '../hooks/useCountdown';

/**
 * CountdownRing – circular progress ring with time display
 * Size variants: 'sm' (40px), 'md' (56px), 'lg' (72px)
 */
export function CountdownRing({ expiresAt, size = 'md' }) {
  const { totalSeconds, isExpired, pct } = useCountdown(expiresAt);
  const color = getRingColor(totalSeconds);
  const isUrgent = totalSeconds < 1800; // < 30 min

  const dims = { sm: 40, md: 56, lg: 72 };
  const strokes = { sm: 3.5, md: 4, lg: 5 };
  const d = dims[size];
  const stroke = strokes[size];
  const r = (d - stroke * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - pct / 100);

  const colors = {
    green: { stroke: 'var(--tertiary)', text: 'var(--tertiary)' },
    amber: { stroke: '#F5A623', text: '#c88000' },
    red: { stroke: 'var(--urgent)', text: 'var(--urgent)' },
  };
  const { stroke: strokeColor, text: textColor } = colors[color];

  const fontSizes = { sm: '8px', md: '10px', lg: '13px' };

  return (
    <div
      style={{ width: d, height: d, flexShrink: 0, position: 'relative' }}
      aria-label={`Food safe for ${formatCountdown(totalSeconds)}`}
      role="timer"
    >
      <svg width={d} height={d} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={d / 2} cy={d / 2} r={r}
          fill="none"
          stroke="var(--surface-container)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={d / 2} cy={d / 2} r={r}
          fill="none"
          stroke={isExpired ? 'var(--outline)' : strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{
            transition: 'stroke-dashoffset 1s linear, stroke 500ms',
            animation: isUrgent && !isExpired ? 'pulse 1s ease-in-out infinite' : 'none',
          }}
        />
      </svg>
      {/* Time text center */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{
          fontSize: fontSizes[size],
          fontWeight: 700,
          color: isExpired ? 'var(--outline)' : textColor,
          lineHeight: 1,
          textAlign: 'center',
          letterSpacing: '-0.02em',
        }}>
          {isExpired ? '—' : formatCountdown(totalSeconds)}
        </span>
      </div>
    </div>
  );
}

/**
 * CountdownBadge – inline pill badge with countdown
 */
export function CountdownBadge({ expiresAt }) {
  const { totalSeconds, isExpired } = useCountdown(expiresAt);
  const color = getRingColor(totalSeconds);
  const isUrgent = totalSeconds < 1800;

  const colorMap = {
    green: { bg: 'rgba(0,110,22,0.1)', text: 'var(--tertiary)' },
    amber: { bg: 'rgba(245,166,35,0.15)', text: '#c88000' },
    red: { bg: 'rgba(226,55,68,0.12)', text: 'var(--urgent)' },
  };
  const { bg, text } = colorMap[color];

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 8px',
      borderRadius: 'var(--radius-full)',
      background: isExpired ? 'var(--surface-container)' : bg,
      color: isExpired ? 'var(--on-surface-variant)' : text,
      fontSize: '11px',
      fontWeight: 700,
      animation: isUrgent && !isExpired ? 'pulse 1s ease-in-out infinite' : 'none',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 0" }}>
        timelapse
      </span>
      {isExpired ? 'Expired' : formatCountdown(totalSeconds)}
    </span>
  );
}
