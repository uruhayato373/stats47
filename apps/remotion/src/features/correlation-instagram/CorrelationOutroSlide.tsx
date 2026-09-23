import React from 'react';

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesCard, IgSeriesEmphasis, IgSeriesFrame } from '@/features/ig-series';

import { combinedSourceLabel, type ResolvedCorrelationCarousel } from './correlation';

interface CorrelationOutroSlideProps {
  resolved: ResolvedCorrelationCarousel;
}

const SERIES = 'correlation' as const;

/** 5枚目: 保存・プロフィール導線 */
export const CorrelationOutroSlide: React.FC<CorrelationOutroSlideProps> = ({ resolved }) => {
  const { spec } = resolved;
  return (
    <IgSeriesFrame series={SERIES} tag="データの相関" sourceLabel={combinedSourceLabel(spec)}>
      <div style={{ marginTop: 140 }}>
        <h1 style={{ ...IG_HEADLINE_STYLE, fontSize: 78, lineHeight: 1.4 }}>
          あなたの県は
          <br />
          どこにありましたか？
        </h1>
        <p style={{ fontSize: 34, fontWeight: IG_FONT.weight.bold, marginTop: 32, lineHeight: 1.5 }}>
          コメントで教えてください
        </p>
        <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <IgSeriesCard style={{ padding: '28px 36px', fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
            <IgSeriesEmphasis series={SERIES}>保存</IgSeriesEmphasis>して、他の相関とも見比べてみて
          </IgSeriesCard>
          <IgSeriesCard style={{ padding: '28px 36px', fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
            全47都道府県のデータは<IgSeriesEmphasis series={SERIES}>プロフィールのリンク</IgSeriesEmphasis>から
          </IgSeriesCard>
        </div>
      </div>
    </IgSeriesFrame>
  );
};
