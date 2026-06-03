"use client";

/**
 * 地方財政ダッシュボード用のミニチャート (PBI Page1 のカード内チャート再現)。
 * - MiniLineChart: 当該団体(実線・青) + 全国平均(破線・灰)。年は等間隔 + ラベル。
 * - MiniBarChart: 年次の棒 (積立金現在高 / 地方債現在高)。
 */

export interface ChartPoint {
  year: number;
  /** 表示単位に変換済みの値 */
  value: number;
}

const BLUE = "#2563eb";
const GRAY = "#94a3b8";

interface LineProps {
  points: ChartPoint[];
  average?: ChartPoint[];
  height?: number;
}

export function MiniLineChart({ points, average, height = 84 }: LineProps) {
  const W = 260;
  const H = height;
  const padX = 10;
  const padTop = 8;
  const padBottom = 18;
  if (points.length === 0) {
    return <div className="flex h-[84px] items-center text-xs text-muted-foreground">データなし</div>;
  }
  const series = average && average.length > 0 ? [...points, ...average] : points;
  const ys = series.map((p) => p.value);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const n = points.length;
  const x = (i: number) => (n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - padX * 2));
  const y = (v: number) => padTop + (1 - (v - minY) / (maxY - minY)) * (H - padTop - padBottom);

  const toPath = (pts: ChartPoint[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="推移">
      {/* 全国平均 (破線) */}
      {average && average.length > 1 && (
        <path d={toPath(average)} fill="none" stroke={GRAY} strokeWidth={1.3} strokeDasharray="4 3" />
      )}
      {/* 当該団体 (実線) */}
      {n > 1 && <path d={toPath(points)} fill="none" stroke={BLUE} strokeWidth={1.8} />}
      {points.map((p, i) => (
        <circle key={p.year} cx={x(i)} cy={y(p.value)} r={i === n - 1 ? 3 : 1.8} fill={BLUE} />
      ))}
      {/* 年ラベル (最初と最後) */}
      {n > 0 && (
        <>
          <text x={x(0)} y={H - 4} fontSize="8" fill={GRAY} textAnchor="start">
            {points[0].year}
          </text>
          <text x={x(n - 1)} y={H - 4} fontSize="8" fill={GRAY} textAnchor="end">
            {points[n - 1].year}
          </text>
        </>
      )}
    </svg>
  );
}

interface BarProps {
  points: ChartPoint[];
  height?: number;
}

export function MiniBarChart({ points, height = 84 }: BarProps) {
  const W = 260;
  const H = height;
  const padX = 10;
  const padTop = 8;
  const padBottom = 18;
  if (points.length === 0) {
    return <div className="flex h-[84px] items-center text-xs text-muted-foreground">データなし</div>;
  }
  const maxY = Math.max(...points.map((p) => p.value), 0);
  const minY = Math.min(...points.map((p) => p.value), 0);
  const span = maxY - minY || 1;
  const n = points.length;
  const slot = (W - padX * 2) / n;
  const barW = Math.min(slot * 0.6, 26);
  const zeroY = padTop + (1 - (0 - minY) / span) * (H - padTop - padBottom);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="年次推移">
      {points.map((p, i) => {
        const cx = padX + slot * (i + 0.5);
        const vy = padTop + (1 - (p.value - minY) / span) * (H - padTop - padBottom);
        const top = Math.min(vy, zeroY);
        const h = Math.max(1, Math.abs(zeroY - vy));
        return (
          <g key={p.year}>
            <rect x={cx - barW / 2} y={top} width={barW} height={h} fill={BLUE} opacity={i === n - 1 ? 1 : 0.55} />
            <text x={cx} y={H - 4} fontSize="8" fill={GRAY} textAnchor="middle">
              {String(p.year).slice(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
