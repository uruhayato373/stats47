import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BRAND as C } from '../../../../web/src/features/ogp/brand';
import { useBuzzMapFonts } from '../buzz-map/useBuzzMapFonts';
import { householdInputSchema, rowsForSlide, domainMax, barGeometry, type HouseholdNoteProps } from './model';

const BLUE = C.primary;
export function HouseholdNote({ input: raw, slide = 'x', focus = ['住居', '光熱・水道'] }: HouseholdNoteProps) {
  useBuzzMapFonts();
  if (!raw) return <AbsoluteFill style={{ background: C.white }} />;
  const input = householdInputSchema.parse(raw), meta = input.chartData._meta;
  const rows = rowsForSlide(input, slide), max = domainMax(input), compact = slide === 'x' || slide === 'note';
  const page = { note: 1, cover: 1, 'categories-1': 2, 'categories-2': 3, source: 4, x: 1 }[slide];
  const label = compact ? '' : ` · ${page} / 4`;
  const title = slide === 'source' ? '比べる前に、4つの条件。' : `${meta.cityName}の家計`;
  const subtitle = slide === 'cover' ? '47市平均と、どこが違う？' : compact ? '家計支出の10分類' : slide === 'source' ? '同じ条件の数字で読みましょう' : `家計支出の10分類 ${slide === 'categories-1' ? '1〜5' : '6〜10'}`;
  const plotLeft = compact ? 418 : 64, plotWidth = compact ? 460 : 952;
  const baseline = plotLeft + plotWidth / max;
  return <AbsoluteFill style={{ background: C.paper, color: C.ink, fontFamily: 'BuzzMapSans, sans-serif' }}>
    <div style={{ position: 'absolute', top: 48, left: 64, right: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <strong style={{ fontSize: 42, letterSpacing: -2 }}>stats47</strong><span style={{ fontSize: 28, color: C.muted }}>家計調査{label}</span>
    </div>
    <h1 style={{ position: 'absolute', top: 138, left: 64, margin: 0, fontSize: slide === 'source' ? 55 : 78, letterSpacing: -3 }}>{title}</h1>
    <div style={{ position: 'absolute', top: 254, left: 64, fontSize: 42, fontWeight: 700 }}>{subtitle}</div>
    <div style={{ position: 'absolute', top: 321, left: 64, fontSize: 30, color: C.muted }}>{meta.year}年 · 二人以上の世帯</div>
    {(compact || slide.startsWith('categories-')) && <svg width="1080" height="1350" viewBox="0 0 1080 1350" style={{ position: 'absolute', inset: 0 }} aria-label={`${meta.cityName}の家計支出の10分類・47市平均との倍率`}>
      {Array.from({ length: Math.round(max * 2) + 1 }, (_, i) => i / 2).map(value => <g key={value}>
        <line x1={plotLeft + plotWidth * value / max} x2={plotLeft + plotWidth * value / max} y1={compact ? 418 : 455} y2={1065} stroke={value === 1 ? C.ink : C.line} strokeWidth={value === 1 ? 2.5 : 1} strokeDasharray={value === 1 ? '8 6' : undefined} />
        <text x={plotLeft + plotWidth * value / max} y={compact ? 396 : 429} textAnchor="middle" fontSize="28" fill={C.muted}>{value.toFixed(1)}</text>
      </g>)}
      {rows.map((r, i) => {
        const y = compact ? 459 + i * 64 : 498 + i * 122;
        const geometry = barGeometry(r.ratio, max, plotLeft, plotWidth);
        return <g key={r.catName} data-category={r.catName} data-ratio={r.ratio}>
          <text x="64" y={y} fontSize={compact ? 34 : 44} fontWeight="600" fill={C.ink}>{r.catName}</text>
          <rect x={geometry.x} y={compact ? y - 28 : y + 24} width={geometry.width} height={compact ? 32 : 35} rx="3" fill={BLUE} />
          <text x="1016" y={y} textAnchor="end" fontSize={compact ? 38 : 44} fontWeight="700" fill={BLUE}>{r.ratio.toFixed(2)}倍</text>
        </g>;
      })}
      <text x={baseline} y="1102" textAnchor="middle" fontSize="28" fill={C.muted}>平均</text>
    </svg>}
    {slide === 'cover' && focus.map((name, i) => {
      const row = rows.find(r => r.catName === name);
      if (!row || i > 1) throw Error('導入で示す費目が固定入力にありません');
      return <div key={name} style={{ position: 'absolute', top: 434 + i * 300, left: 64, right: 64, height: 254, padding: '30px 42px', boxSizing: 'border-box', background: C.white, borderTop: `5px solid ${BLUE}` }}>
        <div style={{ fontSize: 44, fontWeight: 700 }}>{row.catName}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 12 }}><strong style={{ fontSize: 100, color: BLUE, letterSpacing: -4 }}>{row.ratio.toFixed(2)}<span style={{ fontSize: 45, marginLeft: 10 }}>倍</span></strong><span style={{ fontSize: 32, color: C.muted }}>{row.ratio >= 1 ? '47市平均より多い' : '47市平均より少ない'}</span></div>
      </div>;
    })}
    {slide === 'source' && <div style={{ position: 'absolute', top: 428, left: 64, right: 64, fontSize: 35, lineHeight: 1.6 }}>
      {[
        ['対象', `${meta.cityName}の二人以上の世帯`],
        ['年', `${meta.year}年`],
        ['基準', '47都道府県庁所在市の単純平均 = 1.00'],
        ['出典', '総務省統計局「家計調査」'],
      ].map(([name, value]) => <div key={name} style={{ borderTop: `1px solid ${C.line}`, padding: '20px 0' }}><strong style={{ color: BLUE }}>{name}</strong><div>{value}</div></div>)}
      <div style={{ fontSize: 32, marginTop: 24 }}>詳しい図と解説は、noteの家計調査シリーズへ。</div>
    </div>}
    <div style={{ position: 'absolute', top: 1146, left: 64, right: 64, borderTop: `2px solid ${C.line}`, paddingTop: 15, fontSize: 30, lineHeight: 1.5, color: C.muted }}>
      <div>基準：47県庁所在市の単純平均 = 1.00</div>
      <div>出典：総務省統計局「家計調査」</div>
    </div>
  </AbsoluteFill>;
}
