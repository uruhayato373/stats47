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
  const domain = resolveNumericDomain(values, policy);
  if (!domain) return null;
  const position = (value: number) =>
    Math.max(
      0,
      Math.min(100, ((value - domain[0]) / (domain[1] - domain[0])) * 100)
    );
  return (
    <div
      className="space-y-2"
      data-chart="value-dot-plot"
      data-domain-min={domain[0]}
      data-domain-max={domain[1]}
    >
      {items.map((item) => (
        <div
          key={item.key}
          className="grid grid-cols-[6rem_minmax(0,1fr)_max-content] items-center gap-2 text-xs"
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
      <div
        className="grid grid-cols-[6rem_minmax(0,1fr)_max-content] gap-2 text-[11px] text-muted-foreground"
        aria-hidden="true"
      >
        <span />
        <span className="flex justify-between gap-2">
          <span>{formatValue(domain[0])}</span>
          <span>{formatValue(domain[1])}</span>
        </span>
        <span className="invisible">{formatValue(Math.max(...values))}</span>
      </div>
      {reference !== null && (
        <p className="text-xs text-muted-foreground">
          破線: 単純平均 {formatValue(reference)}
        </p>
      )}
    </div>
  );
}
