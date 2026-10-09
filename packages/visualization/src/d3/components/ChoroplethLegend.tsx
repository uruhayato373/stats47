import { createLegendFormatter } from '../utils/color-scale/legend-format';
import type { resolveChoroplethScale } from '../utils/color-scale/resolve-choropleth-scale';

export type ResolvedChoroplethScale = Awaited<
  ReturnType<typeof resolveChoroplethScale>
>;

/** The labels and swatches use the resolved scale that paints the map. */
export function ChoroplethLegend({
  scale,
  unit = '',
}: {
  scale: ResolvedChoroplethScale | null;
  unit?: string;
}) {
  if (!scale?.domain) return null;
  const [min, max] = scale.domain;
  const format = createLegendFormatter(
    [
      ...scale.boundaries,
      ...(scale.midpoint === undefined ? [] : [scale.midpoint]),
    ],
    1,
    scale.method === 'threshold' ? undefined : 2
  );
  const label =
    scale.method === 'continuous'
      ? '値の大きさ'
      : scale.method === 'quantile'
        ? '分位区分'
        : scale.method === 'threshold'
          ? '指定した境界値'
          : '等間隔区分';
  const background =
    scale.method === 'continuous'
      ? `linear-gradient(to right,${Array.from({ length: 21 }, (_, i) => scale.colorAtValue(min + ((max - min) * i) / 20)).join(',')})`
      : undefined;
  return (
    <div
      className="mx-auto max-w-sm px-3 pb-2 text-xs text-muted-foreground"
      aria-label="地図の凡例"
    >
      <p>{label}</p>
      <div className="my-1 flex h-3" style={{ background }}>
        {scale.method !== 'continuous' &&
          scale.colors.map((color, i) => (
            <span
              key={i}
              className="flex-1"
              style={{ background: color }}
              title={`${format(scale.boundaries[i])}〜${format(scale.boundaries[i + 1])} ${unit}`}
            />
          ))}
      </div>
      <div className="flex justify-between gap-3">
        <span>{format(min)}</span>
        <span>
          {format(max)} {unit}
        </span>
      </div>
      {scale.method !== 'continuous' && scale.boundaries.length > 2 && (
        <p className="mt-1">
          境界: {scale.boundaries.slice(1, -1).map(format).join(' / ')} {unit}
        </p>
      )}
      {scale.midpoint !== undefined && (
        <p className="mt-1 flex items-center gap-1">
          <span
            className="h-2.5 w-2.5"
            style={{ background: scale.colorAtValue(scale.midpoint) }}
          />
          基準: {format(scale.midpoint)} {unit}
        </p>
      )}
    </div>
  );
}
