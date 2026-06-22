'use client';

interface GrowthRadarChartProps {
  scores: Record<string, number>;
  labels?: Record<string, string>;
  size?: number;
}

const DEFAULT_LABELS: Record<string, string> = {
  G: 'Growth',
  R: 'Rhythms',
  O: 'Ownership',
  W: 'Willpower',
  T: 'Teamwork',
  H: 'Balance',
};

export function GrowthRadarChart({ scores, labels, size = 300 }: GrowthRadarChartProps) {
  const dims = ['G', 'R', 'O', 'W', 'T', 'H'];
  const displayLabels = labels || DEFAULT_LABELS;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.35;

  const getPoint = (index: number, value: number): [number, number] => {
    const angle = (Math.PI * 2 * index) / dims.length - Math.PI / 2;
    const r = (value / 5) * maxRadius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  const rings = [1, 2, 3, 4, 5];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }}>
      {/* Grid rings */}
      {rings.map((ring) => {
        const points = dims
          .map((_, i) => getPoint(i, ring))
          .map(([x, y]) => `${x},${y}`)
          .join(' ');
        return (
          <polygon
            key={ring}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {dims.map((_, i) => {
        const [x, y] = getPoint(i, 5);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        );
      })}

      {/* Score polygon */}
      <polygon
        points={dims
          .map((d, i) => getPoint(i, scores[d] || 0))
          .map(([x, y]) => `${x},${y}`)
          .join(' ')}
        fill="rgba(197,168,128,0.2)"
        stroke="rgba(197,168,128,0.8)"
        strokeWidth="2"
      />

      {/* Score dots */}
      {dims.map((d, i) => {
        const [x, y] = getPoint(i, scores[d] || 0);
        return (
          <circle
            key={d}
            cx={x}
            cy={y}
            r="4"
            fill="rgba(197,168,128,1)"
          />
        );
      })}

      {/* Labels */}
      {dims.map((d, i) => {
        const [x, y] = getPoint(i, 5.8);
        return (
          <text
            key={d}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="currentColor"
            style={{ fontSize: size * 0.035, color: 'var(--theme-text)' }}
          >
            {displayLabels[d] || d}
          </text>
        );
      })}
    </svg>
  );
}
