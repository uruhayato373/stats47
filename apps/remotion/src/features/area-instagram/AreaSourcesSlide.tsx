import React from 'react';

import { IG_FONT, IG_HEADLINE_STYLE, IgSeriesCard, IgSeriesFrame } from '@/features/ig-series';

import type { ResolvedAreaCarousel } from './area';

interface AreaSourcesSlideProps {
  resolved: ResolvedAreaCarousel;
}

const SERIES = 'area' as const;

/** 4枚目: 出典一覧。前2枚に出てきた出典×年を重複排除して並べる */
export const AreaSourcesSlide: React.FC<AreaSourcesSlideProps> = ({ resolved }) => (
  <IgSeriesFrame series={SERIES} tag="出典" tagVariant="outline" swipeLabel="保存はこちら" sourceLabel={resolved.sourceLines[0] ?? ''}>
    <h1 style={{ ...IG_HEADLINE_STYLE, fontSize: 60, lineHeight: 1.4, marginTop: 40 }}>
      この投稿の出典
    </h1>
    <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {resolved.sourceLines.map((line) => (
        <IgSeriesCard key={line} style={{ padding: '22px 30px', fontSize: 30, fontWeight: IG_FONT.weight.bold }}>
          {line}
        </IgSeriesCard>
      ))}
    </div>
  </IgSeriesFrame>
);
