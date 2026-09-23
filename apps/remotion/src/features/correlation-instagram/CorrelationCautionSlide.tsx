import React from 'react';

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesCard, IgSeriesFrame } from '@/features/ig-series';

import { combinedSourceLabel, type ResolvedCorrelationCarousel } from './correlation';

interface CorrelationCautionSlideProps {
  resolved: ResolvedCorrelationCarousel;
}

const SERIES = 'correlation' as const;

/** 4枚目: 因果ではない旨の注意 (props.caution) */
export const CorrelationCautionSlide: React.FC<CorrelationCautionSlideProps> = ({ resolved }) => {
  const { spec } = resolved;
  return (
    <IgSeriesFrame series={SERIES} tag="注意" tagVariant="outline" swipeLabel="保存はこちら" sourceLabel={combinedSourceLabel(spec)}>
      <h1 style={{ ...IG_HEADLINE_STYLE, fontSize: 62, lineHeight: 1.4, marginTop: 60 }}>
        相関は因果関係を
        <br />
        示しません
      </h1>
      <IgSeriesCard style={{ marginTop: 40, padding: '30px 34px', fontSize: 30, fontWeight: IG_FONT.weight.bold, lineHeight: 1.6 }}>
        {spec.caution}
      </IgSeriesCard>
      <p style={{ fontSize: 22, fontWeight: IG_FONT.weight.bold, marginTop: 24, lineHeight: 1.6, color: '#FFFFFF' }}>
        2つの数字が一緒に動いて見えても、他の要因が影響している可能性があります。
      </p>
      {spec.blogUrl && (
        <p style={{ fontSize: 20, fontWeight: IG_FONT.weight.bold, marginTop: 16 }}>
          詳しい解説はブログ記事にもあります
        </p>
      )}
    </IgSeriesFrame>
  );
};
