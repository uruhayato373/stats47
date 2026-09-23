import React from 'react';

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesCard, IgSeriesEmphasis, IgSeriesFrame } from '@/features/ig-series';

import type { ResolvedAreaCarousel } from './area';

interface AreaOutroSlideProps {
  resolved: ResolvedAreaCarousel;
}

const SERIES = 'area' as const;

/** 5枚目: 保存・プロフィール導線 */
export const AreaOutroSlide: React.FC<AreaOutroSlideProps> = ({ resolved }) => (
  <IgSeriesFrame series={SERIES} tag={`${resolved.spec.areaName}のデータ`} sourceLabel={resolved.sourceLines[0] ?? ''}>
    <div style={{ marginTop: 140 }}>
      <h1 style={{ ...IG_HEADLINE_STYLE, fontSize: 80, lineHeight: 1.4 }}>
        あなたの県は
        <br />
        何位でしたか？
      </h1>
      <p style={{ fontSize: 34, fontWeight: IG_FONT.weight.bold, marginTop: 32, lineHeight: 1.5 }}>
        コメントで教えてください
      </p>
      <div style={{ marginTop: 60, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <IgSeriesCard style={{ padding: '28px 36px', fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
          <IgSeriesEmphasis series={SERIES}>保存</IgSeriesEmphasis>して、他の県とも比べてみて
        </IgSeriesCard>
        <IgSeriesCard style={{ padding: '28px 36px', fontSize: 34, fontWeight: IG_FONT.weight.bold }}>
          全47都道府県は<IgSeriesEmphasis series={SERIES}>プロフィールのリンク</IgSeriesEmphasis>から
        </IgSeriesCard>
      </div>
    </div>
  </IgSeriesFrame>
);
