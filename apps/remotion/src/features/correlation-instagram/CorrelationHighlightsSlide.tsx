import React from 'react';
import { formatNumber } from '@stats47/utils';

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesCard, IgSeriesFrame } from '@/features/ig-series';

import {
  combinedSourceLabel,
  type CorrelationHighlightPoint,
  type ResolvedCorrelationCarousel,
} from './correlation';

interface CorrelationHighlightsSlideProps {
  resolved: ResolvedCorrelationCarousel;
}

const SERIES = 'correlation' as const;

function HighlightRow({
  point,
  spec,
}: {
  point: CorrelationHighlightPoint;
  spec: ResolvedCorrelationCarousel['spec'];
}) {
  return (
    <IgSeriesCard style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
      <div style={{ fontSize: 30, fontWeight: IG_FONT.weight.black, flex: 1, minWidth: 0 }}>{point.name}</div>
      <div style={{ textAlign: 'right', fontSize: 22, fontWeight: IG_FONT.weight.bold, color: '#64748B' }}>
        {spec.x.label} {formatNumber(point.x)}{spec.x.unit}
        <br />
        {spec.y.label} {formatNumber(point.y)}{spec.y.unit}
      </div>
    </IgSeriesCard>
  );
}

/** 3枚目: 目立つ県の解説。傾向の両端 (trendAnchors) と傾向から外れる県 (outliers) */
export const CorrelationHighlightsSlide: React.FC<CorrelationHighlightsSlideProps> = ({ resolved }) => {
  const { spec } = resolved;
  const { trendAnchors, outliers } = spec.highlights;
  return (
    <IgSeriesFrame series={SERIES} tag="目立つ県" swipeLabel="因果ではない注意へ" sourceLabel={combinedSourceLabel(spec)}>
      <h1 style={{ ...IG_HEADLINE_STYLE, fontSize: 54, lineHeight: 1.4, marginTop: 24 }}>
        傾向を象徴する県・外れる県
      </h1>
      {trendAnchors.length === 2 && (
        <>
          <p style={{ fontSize: 24, fontWeight: IG_FONT.weight.bold, marginTop: 20 }}>傾向の両端</p>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {trendAnchors.map((p) => (
              <HighlightRow key={p.areaCode} point={p} spec={spec} />
            ))}
          </div>
        </>
      )}
      {outliers.length === 2 && (
        <>
          <p style={{ fontSize: 24, fontWeight: IG_FONT.weight.bold, marginTop: 24 }}>傾向から外れる県</p>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {outliers.map((p) => (
              <HighlightRow key={p.areaCode} point={p} spec={spec} />
            ))}
          </div>
        </>
      )}
      {trendAnchors.length === 0 && outliers.length === 0 && (
        <IgSeriesCard style={{ marginTop: 24, padding: '24px 28px', fontSize: 26, fontWeight: IG_FONT.weight.bold }}>
          47都道府県のばらつきが小さく、特定の県を挙げられませんでした
        </IgSeriesCard>
      )}
    </IgSeriesFrame>
  );
};
