import { Fragment } from 'react';

import { stripPosition, type StripScale } from '@stats47/ranking';

export interface StripGroup {
  key: string;
  label: string;
  values: readonly number[];
  median: number;
}

/** 行の SVG の座標の幅。行は preserveAspectRatio="none" で横に伸ばし、線の太さは non-scaling-stroke で保つ */
const ROW_WIDTH = 1000;
const ROW_HEIGHT = 20;
/** 目盛りがこの数以上あるとき、狭い画面では目盛りの文字を 1 つおきに出す */
const NARROW_TICK_LABEL_LIMIT = 5;

/**
 * まとまり (都道府県など) ごとに 1 行、中の値を 1 つずつ縦の短い印で並べる帯 (ストリッププロット)。
 * 全行で 1 つの軸を共有し、太い縦線がまとまりの中央値。印は半透明なので重なった所が濃くなる。
 * サーバーで描き、ページの JavaScript を増やさない。1 行の印は 1 本の path にまとめる
 * (市区町村 1,741 個を 1 つずつ要素にするとページの要素が約 3 倍になり、ページ品質の予算 (前回比 +30%) を外れた)。
 * 行ごとに grid を作ると右端の値の桁数で軸の幅が行ごとにずれるので、ValueDotPlot と同じく全行で 1 つの grid を共有する。
 */
export function GroupedStripPlot({
  groups,
  scale,
  formatTick,
  formatValue,
  color,
  unit,
  ariaLabel,
}: {
  groups: readonly StripGroup[];
  scale: StripScale;
  /** 目盛りの文字 (単位を付けない短い形。単位は図の下に 1 回だけ書く) */
  formatTick: (value: number) => string;
  /** 右端の中央値の文字 */
  formatValue: (value: number) => string;
  /** 指標の地図と共通の配色から解決した代表色 */
  color: string;
  unit: string;
  ariaLabel: string;
}) {
  // 座標は整数 (1,000 分の 1 の幅。画面の 1px より細かい)。図の中身は HTML と RSC の 2 か所に入るので短く書く
  const x = (value: number) => Math.round((stripPosition(scale, value) / 100) * ROW_WIDTH);
  const grid = [
    `M0 ${ROW_HEIGHT / 2}H${ROW_WIDTH}`,
    ...scale.ticks.map((tick) => `M${x(tick)} 0V${ROW_HEIGHT}`),
  ].join('');
  const axis = (
    <>
      <span aria-hidden="true" />
      <span aria-hidden="true" className="relative h-4 text-[11px] text-muted-foreground tabular-nums">
        {scale.ticks.map((tick, index) => (
          <span
            key={tick}
            // 狭い画面 (帯の幅 約 180px) で目盛りが 5 つ以上あると文字がくっつく (390px で「100万」と「1,000万」が接した)。
            // 文字だけを 1 つおきに出し、目盛りの点線は全部残す
            className={`absolute top-0 -translate-x-1/2 whitespace-nowrap${scale.ticks.length >= NARROW_TICK_LABEL_LIMIT && index % 2 === 1 ? ' max-sm:hidden' : ''}`}
            data-tick-thinned={scale.ticks.length >= NARROW_TICK_LABEL_LIMIT && index % 2 === 1 ? '' : undefined}
            style={{ left: `${stripPosition(scale, tick)}%` }}
          >
            {formatTick(tick)}
          </span>
        ))}
      </span>
      <span aria-hidden="true" />
    </>
  );
  return (
    <figure aria-label={ariaLabel} className="m-0">
      <div
        className="grid grid-cols-[4.5rem_minmax(0,1fr)_max-content] items-center gap-x-2 gap-y-0.5 text-xs"
        data-chart="grouped-strip-plot"
        data-scale={scale.kind}
      >
        {axis}
        {groups.map((group) => (
          <Fragment key={group.key}>
            <span className="truncate" data-group={group.key} data-count={group.values.length}>{group.label}</span>
            <svg
              viewBox={`0 0 ${ROW_WIDTH} ${ROW_HEIGHT}`}
              preserveAspectRatio="none"
              className="h-5 w-full overflow-visible"
              aria-hidden="true"
            >
              <path d={grid} className="stroke-border" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
              <path
                d={group.values.map((value) => `M${x(value)} 5V15`).join('')}
                stroke={color}
                strokeOpacity={0.45}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              <path
                d={`M${x(group.median)} 1V19`}
                stroke="currentColor"
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
                className="text-foreground"
              />
            </svg>
            <span className="whitespace-nowrap text-right tabular-nums">{formatValue(group.median)}</span>
          </Fragment>
        ))}
        {axis}
      </div>
      <figcaption className="mt-1 text-right text-[11px] text-muted-foreground">
        目盛りの単位: {unit}{scale.kind === 'log' && '・10 倍ごとの対数の目盛り'}{scale.clipped && '・範囲の外の値は端に寄せて表示'}
      </figcaption>
    </figure>
  );
}
