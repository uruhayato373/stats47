import { cn } from '@stats47/components';
import { resolveNumericDomain, type NumericDomainPolicy } from '@stats47/types';

interface DotPlotItem {
  key: string;
  label: string;
  rank: number;
  value: number;
}

/** Points share a numerical scale; exact values remain in every row. */
export function ValueDotPlot({
  items,
  values,
  reference,
  policy,
  formatValue,
  color,
  unit = '',
  showAxes = true,
  fillHeight = false,
  showReferenceLine = true,
}: {
  items: DotPlotItem[];
  values: number[];
  reference: number | null;
  policy: NumericDomainPolicy;
  formatValue: (value: number) => string;
  /** 指標の地図と共通の配色から解決した代表色。省略時はテーマ色。 */
  color?: string;
  unit?: string;
  /** 行末の正確な値が主になる小さなカードでは軸の数字を省略する。 */
  showAxes?: boolean;
  /** 親の余白を行に均等配分する。親が自然高なら各行の最小高だけを使う。 */
  fillHeight?: boolean;
  /** 平均をツールチップだけで読ませる場合は縦の基準線を省く。 */
  showReferenceLine?: boolean;
}) {
  const resolved = resolveNumericDomain(values, policy);
  if (!resolved) return null;
  // 全値が非負なら軸を負へ伸ばさない (余白付きの範囲で「-162,605」のような実在しない目盛りが出ていた)
  const domain: [number, number] = policy.mode !== 'fixed' && values.every((value) => value >= 0)
    ? [Math.max(0, resolved[0]), resolved[1]]
    : resolved;
  const position = (value: number) =>
    Math.max(
      0,
      Math.min(100, ((value - domain[0]) / (domain[1] - domain[0])) * 100)
    );
  return (
    // 行ごとに grid を作ると右端の値の桁数で軸の幅が行ごとにずれる。全行で 1 つの grid を共有する。
    <div
      className={cn(
        'grid grid-cols-[6rem_minmax(0,1fr)_max-content] items-center gap-x-2 gap-y-2 text-xs',
        fillHeight && 'flex-1 auto-rows-[minmax(1.5rem,1fr)]',
      )}
      data-chart="value-dot-plot"
      data-domain-min={domain[0]}
      data-domain-max={domain[1]}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="contents"
          data-value={item.value}
        >
          <span className="flex items-baseline gap-2">
            <span className="w-5 shrink-0 text-right text-muted-foreground">
              {item.rank}
            </span>
            <span className="truncate">{item.label}</span>
          </span>
          <div className="relative h-6" aria-hidden="true">
            <span className="absolute inset-x-0 top-1/2 border-t border-border" />
            {reference !== null && showReferenceLine && (
              <span
                className="absolute inset-y-0 w-3 -translate-x-1/2"
                style={{ left: `${position(reference)}%` }}
                data-reference={reference}
                title={`単純平均: ${formatValue(reference)}${unit}`}
              >
                <span className="absolute inset-y-0 left-1/2 border-l border-dashed border-muted-foreground/60" />
              </span>
            )}
            {item.value < domain[0] || item.value > domain[1] ? (
              <span
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"
                style={{ left: `${position(item.value)}%`, color }}
                title={`${item.label}: ${formatValue(item.value)}${unit}（表示範囲外）${reference !== null ? `\n単純平均: ${formatValue(reference)}${unit}` : ''}`}
              >
                {item.value < domain[0] ? '◀' : '▶'}
              </span>
            ) : (
              <span
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
                style={{ left: `${position(item.value)}%`, backgroundColor: color }}
                title={`${item.label}: ${formatValue(item.value)}${unit}${reference !== null ? `\n単純平均: ${formatValue(reference)}${unit}` : ''}`}
              />
            )}
          </div>
          <span className="whitespace-nowrap text-right font-medium tabular-nums">
            {formatValue(item.value)}
          </span>
        </div>
      ))}
      {showAxes && <>
        {/* 端の目盛りは全行で共通の軸の端にそろえる。 */}
        <span aria-hidden="true" />
        <span
          aria-hidden="true"
          className="-mt-1 flex justify-between gap-2 text-xs text-muted-foreground tabular-nums"
        >
          <span>{formatValue(domain[0])}</span>
          <span>{formatValue(domain[1])}</span>
        </span>
        <span aria-hidden="true" />
      </>}
      {reference !== null && (
        <span className="sr-only">単純平均: {formatValue(reference)}{unit}</span>
      )}
    </div>
  );
}
