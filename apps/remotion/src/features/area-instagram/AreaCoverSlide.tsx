import React from 'react';
import { formatNumber } from '@stats47/utils';

import { IG_FONT, IG_HEADLINE_STYLE, IG_NUMBER_STYLE, IgSeriesCard, IgSeriesFrame } from '@/features/ig-series';

import type { ResolvedAreaCarousel } from './area';

interface AreaCoverSlideProps {
  resolved: ResolvedAreaCarousel;
}

const SERIES = 'area' as const;

/** 1枚目: 表紙。県名と問いかけ、あれば全国トップクラスの一押し項目を見せる */
export const AreaCoverSlide: React.FC<AreaCoverSlideProps> = ({ resolved }) => {
  const { spec } = resolved;
  const teaserItem = spec.groups[0].items.find((item) => item.rankingKey === spec.teaser?.rankingKey);
  return (
    <IgSeriesFrame series={SERIES} tag={`${spec.areaName}のデータ`} swipeLabel="全国トップクラスへ" sourceLabel={resolved.sourceLines[0] ?? '出典は次のスライドへ'}>
      <h1
        style={{
          ...IG_HEADLINE_STYLE,
          fontSize: spec.coverHook.length > 10 ? 82 : 90,
          lineHeight: 1.4,
          marginTop: 64,
          letterSpacing: -1,
        }}
      >
        {spec.coverHook}
      </h1>
      {spec.teaser && (
        <IgSeriesCard style={{ marginTop: 56, padding: '32px 36px', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 26, fontWeight: IG_FONT.weight.bold, color: '#64748B' }}>
            全国{spec.teaser.rank}位
          </span>
          <span style={{ ...IG_HEADLINE_STYLE, fontSize: 56, lineHeight: 1.3, marginTop: 8 }}>
            {spec.teaser.label}
          </span>
          <span style={{ marginTop: 10, fontSize: 44 }}>
            <span style={{ ...IG_NUMBER_STYLE }}>{formatNumber(spec.teaser.value)}</span>
            <span style={{ fontSize: 26, fontWeight: IG_FONT.weight.bold, marginLeft: 6 }}>{spec.teaser.unit}</span>
          </span>
          {teaserItem?.scopeNote && (
            <span style={{ marginTop: 16, fontSize: 24, lineHeight: 1.5, color: '#475569' }}>
              {teaserItem.scopeNote}
            </span>
          )}
        </IgSeriesCard>
      )}
    </IgSeriesFrame>
  );
};
