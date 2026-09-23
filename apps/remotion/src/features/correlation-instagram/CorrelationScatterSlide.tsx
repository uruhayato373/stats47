import React from 'react';
import { formatNumber } from '@stats47/utils';

import { IG_FONT, IG_SERIES, IgSeriesCard, IgSeriesFrame } from '@/features/ig-series';

import { combinedSourceLabel, formatR, type ResolvedCorrelationCarousel } from './correlation';

interface CorrelationScatterSlideProps {
  resolved: ResolvedCorrelationCarousel;
}

const SERIES = 'correlation' as const;
const PLOT_W = 900;
const PLOT_H = 620;
const INSET = 26;
/**
 * カードの marginBottom に使う下端クリアランス。IgSeriesFrame はスワイプ誘導 (bottom:110 付近) と
 * フッター (bottom:44 付近) を絶対配置で重ねるため、flex:1 のカードがそこまで伸び切ると
 * テキストが重なる (2026-09-23 実測: クリアランス無しで軸ラベル・n がフッターと重なった)。
 */
const FOOTER_CLEARANCE = 170;

interface Domain {
  min: number;
  max: number;
}

/** データの最小/最大に8%の余白を足す (0除算対策で範囲0のときは±1) */
function domainWithPadding(values: number[]): Domain {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.08 || 1;
  return { min: min - pad, max: max + pad };
}

function scale(value: number, domain: Domain, size: number): number {
  if (domain.max === domain.min) return size / 2;
  return INSET + ((value - domain.min) / (domain.max - domain.min)) * (size - INSET * 2);
}

/** 2/5枚目: 47都道府県の散布図。軸ラベル・単位・年、r と人口の影響を除いた r を表示する */
export const CorrelationScatterSlide: React.FC<CorrelationScatterSlideProps> = ({ resolved }) => {
  const { spec } = resolved;
  const palette = IG_SERIES[SERIES];
  const xDomain = domainWithPadding(spec.points.map((p) => p.x));
  const yDomain = domainWithPadding(spec.points.map((p) => p.y));

  return (
    <IgSeriesFrame series={SERIES} tag="47都道府県" swipeLabel="目立つ県の解説へ" sourceLabel={combinedSourceLabel(spec)}>
      <div style={{ marginTop: 20, fontSize: 22, fontWeight: IG_FONT.weight.bold, lineHeight: 1.5 }}>
        縦軸: {spec.y.label}（{spec.y.unit}・{spec.y.year}年）
      </div>
      <div style={{ marginTop: 4, fontSize: 22, fontWeight: IG_FONT.weight.bold, lineHeight: 1.5 }}>
        横軸: {spec.x.label}（{spec.x.unit}・{spec.x.year}年）
      </div>
      <IgSeriesCard
        style={{
          marginTop: 16,
          marginBottom: FOOTER_CLEARANCE,
          padding: 20,
          position: 'relative',
          flex: 1,
          minHeight: 0,
        }}
      >
        <svg viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} style={{ width: '100%', height: '100%' }}>
          <line x1={INSET} y1={PLOT_H - INSET} x2={PLOT_W - INSET} y2={PLOT_H - INSET} stroke="#CBD5E1" strokeWidth={2} />
          <line x1={INSET} y1={INSET} x2={INSET} y2={PLOT_H - INSET} stroke="#CBD5E1" strokeWidth={2} />
          {spec.points.map((p) => (
            <circle
              key={p.prefCode}
              cx={scale(p.x, xDomain, PLOT_W)}
              cy={PLOT_H - scale(p.y, yDomain, PLOT_H)}
              r={10}
              fill={palette.accent}
              fillOpacity={0.82}
            />
          ))}
        </svg>
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '10px 18px',
            borderRadius: 14,
            backgroundColor: '#111111',
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: IG_FONT.weight.black,
            lineHeight: 1.5,
          }}
        >
          r = {formatR(spec.r)}
          <br />
          人口の影響を除くと r = {formatR(spec.rPopulationAdjusted)}
          <br />
          n = {formatNumber(spec.n)}都道府県
        </div>
      </IgSeriesCard>
    </IgSeriesFrame>
  );
};
