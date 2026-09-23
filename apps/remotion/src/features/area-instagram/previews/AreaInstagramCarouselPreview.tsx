import React from 'react';

import { useIgSeriesFonts } from '@/features/ig-series';
import areaSample from '@/fixtures/area-carousel-sample.json';

import { AreaCoverSlide } from '../AreaCoverSlide';
import { AreaGroupSlide } from '../AreaGroupSlide';
import { AreaOutroSlide } from '../AreaOutroSlide';
import { AreaSourcesSlide } from '../AreaSourcesSlide';
import { resolveAreaCarousel, type AreaCarouselSlide } from '../area';

interface AreaInstagramCarouselPreviewProps {
  slide?: AreaCarouselSlide;
  areaCode?: string;
  [key: string]: unknown;
}

/**
 * 地域カルーセル（4:5・5枚）
 *
 * `slide` で 表紙 → 全国トップクラス → 全国では下位 → 出典一覧 → 締め を切り替える。
 * props を省略すると山形県のサンプルで描画する。実データは
 * `.claude/scripts/sns/build-ig-area-props.ts` の出力 (props.json) をそのまま渡す。
 */
export const AreaInstagramCarouselPreview: React.FC<AreaInstagramCarouselPreviewProps> = ({
  slide = 'cover',
  ...rest
}) => {
  useIgSeriesFonts();
  const raw = rest.areaCode ? rest : areaSample;
  const resolved = resolveAreaCarousel(raw);

  switch (slide) {
    case 'cover':
      return <AreaCoverSlide resolved={resolved} />;
    case 'top':
      return <AreaGroupSlide resolved={resolved} group={resolved.topGroup} direction="top" />;
    case 'bottom':
      return <AreaGroupSlide resolved={resolved} group={resolved.bottomGroup} direction="bottom" />;
    case 'sources':
      return <AreaSourcesSlide resolved={resolved} />;
    case 'outro':
      return <AreaOutroSlide resolved={resolved} />;
    default:
      return <AreaCoverSlide resolved={resolved} />;
  }
};
