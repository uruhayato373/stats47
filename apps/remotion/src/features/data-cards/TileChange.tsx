import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { DataCard } from './model';

import { renderAll47TileSvg, type All47Scale } from './all47-svg';
export { CHANGE_TILE_LAYOUT } from './tile-layout';
export const CHANGE_BINS = [
  { label: '−30%未満', color: '#164F86', text: '#FFFFFF' },
  { label: '−30%以上 −10%未満', color: '#8EB8D8', text: '#15334D' },
  { label: '−10%以上 +10%未満', color: '#E9E6DD', text: '#263C48' },
  { label: '+10%以上 +30%未満', color: '#F2B77B', text: '#593113' },
  { label: '+30%以上', color: '#B85129', text: '#FFFFFF' },
] as const;
const CHANGE_THRESHOLDS = [-30, -10, 10, 30] as const;
export function changeBin(value: number): number {
  if (!Number.isFinite(value)) throw new Error('増減率は有限値が必要です');
  return value < -30
    ? 0
    : value < -10
      ? 1
      : value < 10
        ? 2
        : value < 30
          ? 3
          : 4;
}
export function signedPercent(value: number): string {
  const rounded = Number(value.toFixed(1));
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(1)}%`;
}
type TileCard = Extract<DataCard, { kind: 'tile-change' }>;
const sum = (rows: TileCard['rows'], key: 'before' | 'after') =>
  rows.reduce((a, r) => a + r[key], 0);

/** The fixed diverging bins as a tile scale; the ends of the legend are the observed extremes. */
function changeScale(changes: number[]): All47Scale {
  const lo = Math.min(...changes, CHANGE_THRESHOLDS[0]), hi = Math.max(...changes, CHANGE_THRESHOLDS[3]);
  return {
    colors: CHANGE_BINS.map((b) => b.color),
    boundaries: [lo, ...CHANGE_THRESHOLDS, hi],
    colorAt: (v) => CHANGE_BINS[changeBin(v)].color,
    formatBoundary: signedPercent,
    labelEnds: false,
  };
}

/** Change between two years on the shared 4:5 tile map (all47-svg.ts), with the national total in the panel. */
export function renderTileChangeSvg(card: TileCard): string {
  const aggregate = (sum(card.rows, 'after') / sum(card.rows, 'before') - 1) * 100;
  return renderAll47TileSvg(
    card.rows.map((r) => ({ areaCode: r.code, areaName: r.name, value: r.change })),
    {
      title: card.title.replace(/\n/g, ''),
      year: `${card.beforeYear} → ${card.afterYear}年`,
      unit: '%',
      note: `${card.scope} · 増減率`,
      source: [...new Set(card.sources.map((s) => s.name))].join('・'),
      scale: changeScale(card.rows.map((r) => r.change)),
      formatValue: signedPercent,
      panel: {
        heading: '47都道府県の合計',
        value: signedPercent(aggregate),
        caption: card.summary,
        valueColor: aggregate < 0 ? CHANGE_BINS[0].color : CHANGE_BINS[4].color,
      },
    }
  );
}

export function TileChange({ card }: { card: TileCard }) {
  return (
    <AbsoluteFill style={{ background: '#F8FAFC' }}>
      <div style={{ width: 1080, height: 1350 }} dangerouslySetInnerHTML={{ __html: renderTileChangeSvg(card) }} />
    </AbsoluteFill>
  );
}
