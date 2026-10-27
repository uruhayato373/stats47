import { resolveNumericDomain, type NumericDomainPolicy } from '@stats47/types';

interface DotPlotItem {
  key: string;
  label: string;
  rank: number;
  value: number;
}

/** Position encodes the value; a cropped axis is explicit and never resembles a length-encoded bar. */
export function ValueDotPlot({
  items,
  values,
  reference,
  policy,
  formatValue,
}: {
  items: DotPlotItem[];
  values: number[];
  reference: number | null;
  policy: NumericDomainPolicy;
  formatValue: (value: number) => string;
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
      className="grid grid-cols-[6rem_minmax(0,1fr)_max-content] items-center gap-x-2 gap-y-2 text-xs"
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
            {reference !== null && (
              <span
                className="absolute inset-y-0 border-l border-dashed border-muted-foreground/60"
                style={{ left: `${position(reference)}%` }}
              />
            )}
            {item.value < domain[0] || item.value > domain[1] ? (
              <span
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"
                style={{ left: `${position(item.value)}%` }}
                title="表示範囲外"
              >
                {item.value < domain[0] ? '◀' : '▶'}
              </span>
            ) : (
              <span
                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-background"
                style={{ left: `${position(item.value)}%` }}
              />
            )}
          </div>
          <span className="whitespace-nowrap text-right font-medium tabular-nums">
            {formatValue(item.value)}
          </span>
        </div>
      ))}
      {/* 端の目盛りは軸の端に揃える: 左端の値は左寄せ、右端の値は右寄せ */}
      <span aria-hidden="true" />
      <span
        aria-hidden="true"
        className="-mt-1 flex justify-between gap-2 text-xs text-muted-foreground tabular-nums"
      >
        <span>{formatValue(domain[0])}</span>
        <span>{formatValue(domain[1])}</span>
      </span>
      <span aria-hidden="true" />
      {reference !== null && (
        <p className="col-span-3 text-xs text-muted-foreground">
          破線: 単純平均 {formatValue(reference)}
        </p>
      )}
    </div>
  );
}
