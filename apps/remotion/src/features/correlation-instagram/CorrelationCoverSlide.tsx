import React from 'react';

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesFrame } from '@/features/ig-series';

import { combinedSourceLabel, type ResolvedCorrelationCarousel } from './correlation';

interface CorrelationCoverSlideProps {
  resolved: ResolvedCorrelationCarousel;
}

const SERIES = 'correlation' as const;

/** 1枚目: 表紙。2指標の問いかけ (props.hook) */
export const CorrelationCoverSlide: React.FC<CorrelationCoverSlideProps> = ({ resolved }) => {
  const { spec } = resolved;
  return (
    <IgSeriesFrame series={SERIES} tag="データの相関" swipeLabel="47都道府県の散布図へ" sourceLabel={combinedSourceLabel(spec)}>
      <h1
        style={{
          ...IG_HEADLINE_STYLE,
          fontSize: 78,
          lineHeight: 1.45,
          marginTop: 72,
          letterSpacing: -1,
        }}
      >
        {spec.hook}
      </h1>
      <p style={{ fontSize: 30, fontWeight: IG_FONT.weight.bold, marginTop: 40, lineHeight: 1.6 }}>
        {spec.x.label} × {spec.y.label}
      </p>
    </IgSeriesFrame>
  );
};
