import React from 'react';
import { AbsoluteFill } from 'remotion';
import type { DataCard } from './model';

import { CHANGE_TILE_LAYOUT } from './tile-layout';
import { prefectureShortName } from '@stats47/area/short-name';
export { CHANGE_TILE_LAYOUT } from './tile-layout';
export const CHANGE_BINS = [
  { label: '−30%未満', color: '#164F86', text: '#FFFFFF' },
  { label: '−30%以上 −10%未満', color: '#8EB8D8', text: '#15334D' },
  { label: '−10%以上 +10%未満', color: '#E9E6DD', text: '#263C48' },
  { label: '+10%以上 +30%未満', color: '#F2B77B', text: '#593113' },
  { label: '+30%以上', color: '#B85129', text: '#FFFFFF' },
] as const;
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

export function TileChange({ card }: { card: TileCard }) {
  const byCode = new Map(card.rows.map((r) => [Number(r.code.slice(0, 2)), r]));
  if (byCode.size !== 47 || CHANGE_TILE_LAYOUT.some(([id]) => !byCode.has(id)))
    throw new Error('47都道府県の重複なしデータが必要です');
  const aggregate =
    (sum(card.rows, 'after') / sum(card.rows, 'before') - 1) * 100;
  return (
    <AbsoluteFill
      style={{
        background: '#F8F5EC',
        color: '#183B48',
        fontFamily: 'BuzzMapSans, sans-serif',
        padding: 52,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <strong style={{ fontSize: 36 }}>stats47</strong>
        <span style={{ fontSize: 23 }}>47都道府県の長期変化</span>
      </div>
      <div
        style={{
          fontSize: 62,
          fontWeight: 700,
          lineHeight: 1.2,
          whiteSpace: 'pre-line',
          marginTop: 27,
          letterSpacing: -2,
        }}
      >
        {card.title}
      </div>
      <div style={{ fontSize: 30, marginTop: 18, fontWeight: 700 }}>
        {card.beforeYear} → {card.afterYear}年{' '}
        <span style={{ fontWeight: 400, fontSize: 22 }}>／ 数字は増減率</span>
      </div>
      <div style={{ position: 'absolute', top: 352, left: 64, width: 600 }}>
        <div style={{ fontSize: 22, letterSpacing: 2 }}>47都道府県の合計</div>
        <div
          style={{
            fontSize: 93,
            fontWeight: 700,
            lineHeight: 1.3,
            color: aggregate < 0 ? '#164F86' : '#B85129',
          }}
        >
          {signedPercent(aggregate)}
        </div>
        <div style={{ fontSize: 29, fontWeight: 700, marginTop: 12 }}>
          {card.summary}
        </div>
        <div style={{ fontSize: 22, marginTop: 21, lineHeight: 1.6 }}>
          あなたの県は、どちらに変化しましたか。
          <br />
          同じ大きさのタイルで見比べよう。
        </div>
      </div>
      <svg
        style={{ position: 'absolute', left: 60, top: 302 }}
        width="960"
        height="880"
        viewBox="0 0 960 880"
      >
        {CHANGE_TILE_LAYOUT.map(([id, x, y]) => {
          const r = byCode.get(id)!;
          const color = CHANGE_BINS[changeBin(r.change)];
          const name = prefectureShortName(r.name);
          return (
            <g key={id} transform={`translate(${x * 80},${y * 80})`}>
              <rect width="75" height="75" rx="8" fill={color.color} />
              <text
                x="37.5"
                y="28"
                textAnchor="middle"
                fill={color.text}
                fontSize="21"
                fontWeight="700"
              >
                {name}
              </text>
              <text
                x="37.5"
                y="56"
                textAnchor="middle"
                fill={color.text}
                fontSize={signedPercent(r.change).length > 6 ? 18 : 21}
                fontWeight="700"
                letterSpacing="-1"
              >
                {signedPercent(r.change)}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 556,
          right: 60,
          top: 982,
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 10,
          fontSize: 19,
        }}
      >
        {CHANGE_BINS.map((b) => (
          <div
            key={b.label}
            style={{ display: 'flex', alignItems: 'center', gap: 9 }}
          >
            <span
              style={{
                background: b.color,
                width: 25,
                height: 20,
                border: '1px solid #183B4833',
                flexShrink: 0,
              }}
            />
            {b.label}
          </div>
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          bottom: 34,
          fontSize: 20,
          lineHeight: 1.55,
          color: '#425965',
          borderTop: '1px solid #C9CCC5',
          paddingTop: 13,
        }}
      >
        <div>{card.scope}。増減率＝（終年÷始年−1）×100。</div>
        <div>
          出典：{[...new Set(card.sources.map((s) => s.name))].join('・')}
        </div>
        <div>
          {card.metricKeys[0] === 'total-population' ? '2025年は確定値。' : ''}
          表示は小数1桁。県の配置は模式図です。／ stats47.jp
        </div>
      </div>
    </AbsoluteFill>
  );
}
