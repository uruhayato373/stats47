import React from 'react';
import { formatNumber } from '@stats47/utils';

import {
  IG_FONT,
  IG_HEADLINE_STYLE,
  IG_NUMBER_STYLE,
  IG_PILL_SOLID,
  IgSeriesCard,
  IgSeriesFrame,
} from '@/features/ig-series';

import type { AreaCarouselGroup, ResolvedAreaCarousel } from './area';

interface AreaGroupSlideProps {
  resolved: ResolvedAreaCarousel;
  group: AreaCarouselGroup;
  direction: 'top' | 'bottom';
}

const SERIES = 'area' as const;

/**
 * 2/3枚目: グループ (全国トップクラス / 全国では下位)。全項目に順位・値・単位・年・出典を表示する
 * (props に欠けていれば AreaCarouselItemSchema が先に render を止める)。
 */
export const AreaGroupSlide: React.FC<AreaGroupSlideProps> = ({ resolved, group, direction }) => {
  const { spec } = resolved;
  const swipeLabel = direction === 'top' ? '全国では下位へ' : '出典一覧へ';
  return (
    <IgSeriesFrame
      series={SERIES}
      tag={group.title}
      swipeLabel={swipeLabel}
      sourceLabel="各項目に記載（出典一覧は次へ）"
    >
      <h1 style={{ ...IG_HEADLINE_STYLE, fontSize: 56, lineHeight: 1.3, marginTop: 24 }}>
        {spec.areaName}が{group.title}
      </h1>
      <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {group.items.map((item) => (
          <IgSeriesCard
            key={item.rankingKey}
            style={{ padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 20 }}
          >
            <span
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 999,
                backgroundColor: IG_PILL_SOLID.background,
                color: IG_PILL_SOLID.ink,
                fontSize: 26,
                fontWeight: IG_FONT.weight.black,
              }}
            >
              {item.rank}位
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 28, fontWeight: IG_FONT.weight.black, lineHeight: 1.3 }}>{item.label}</div>
              <div style={{ fontSize: 18, color: '#64748B', fontWeight: IG_FONT.weight.bold, marginTop: 4 }}>
                {item.year}年・出典: {item.source}
                {item.scopeNote ? `・${item.scopeNote}` : ''}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span style={{ ...IG_NUMBER_STYLE, fontSize: 34 }}>{formatNumber(item.value)}</span>
              <span style={{ fontSize: 20, fontWeight: IG_FONT.weight.bold, marginLeft: 4 }}>{item.unit}</span>
            </div>
          </IgSeriesCard>
        ))}
      </div>
    </IgSeriesFrame>
  );
};
