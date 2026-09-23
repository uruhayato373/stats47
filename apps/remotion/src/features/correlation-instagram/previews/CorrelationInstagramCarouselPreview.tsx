import React from 'react';

import { useIgSeriesFonts } from '@/features/ig-series';
import correlationSample from '@/fixtures/correlation-carousel-sample.json';

import { CorrelationCautionSlide } from '../CorrelationCautionSlide';
import { CorrelationCoverSlide } from '../CorrelationCoverSlide';
import { CorrelationHighlightsSlide } from '../CorrelationHighlightsSlide';
import { CorrelationOutroSlide } from '../CorrelationOutroSlide';
import { CorrelationScatterSlide } from '../CorrelationScatterSlide';
import { resolveCorrelationCarousel, type CorrelationCarouselSlide } from '../correlation';

interface CorrelationInstagramCarouselPreviewProps {
  slide?: CorrelationCarouselSlide;
  x?: unknown;
  [key: string]: unknown;
}

/**
 * 相関カルーセル（4:5・5枚）
 *
 * `slide` で 表紙 → 散布図 → 目立つ県の解説 → 因果ではない注意 → 締め を切り替える。
 * props を省略すると高齢化率×診療所数のサンプルで描画する。実データは
 * `.claude/scripts/sns/build-ig-correlation-props.ts` の出力 (props.json) をそのまま渡す。
 */
export const CorrelationInstagramCarouselPreview: React.FC<CorrelationInstagramCarouselPreviewProps> = ({
  slide = 'cover',
  ...rest
}) => {
  useIgSeriesFonts();
  const raw = rest.x ? rest : correlationSample;
  const resolved = resolveCorrelationCarousel(raw);

  switch (slide) {
    case 'cover':
      return <CorrelationCoverSlide resolved={resolved} />;
    case 'scatter':
      return <CorrelationScatterSlide resolved={resolved} />;
    case 'highlights':
      return <CorrelationHighlightsSlide resolved={resolved} />;
    case 'caution':
      return <CorrelationCautionSlide resolved={resolved} />;
    case 'outro':
      return <CorrelationOutroSlide resolved={resolved} />;
    default:
      return <CorrelationCoverSlide resolved={resolved} />;
  }
};
