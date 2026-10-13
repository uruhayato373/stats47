import {
  type RankingEntry,
  type RankingMeta,
  type ThemeName,
  resolveRankingData,
} from '@/shared';
import { renderAll47TileSvg } from '../../data-cards/all47-svg';
import { useBuzzMapFonts } from '../../buzz-map/useBuzzMapFonts';
import React from 'react';

interface RankingChartXPreviewProps {
  theme?: ThemeName;
  meta?: RankingMeta;
  allEntries?: RankingEntry[];
  displayTitle?: string;
}

export const RankingChartXPreview: React.FC<RankingChartXPreviewProps> = ({
  meta,
  allEntries,
  displayTitle,
}) => {
  useBuzzMapFonts();
  const { meta: resolved, entries } = resolveRankingData({ meta, allEntries });
  const svg = renderAll47TileSvg(entries, {
    title: displayTitle || resolved.title,
    year: resolved.yearName || '',
    unit: resolved.unit,
    source: resolved.sourceLabel || 'e-Stat',
    capitalCities: /県庁所在市/.test([resolved.subtitle, resolved.note].filter(Boolean).join('・')),
    note:
      [
        resolved.subtitle,
        resolved.demographicAttr,
        resolved.normalizationBasis,
        resolved.note,
      ]
        .filter(Boolean)
        .join('・') || undefined,
  });
  return (
    <div
      style={{ width: 1080, height: 1350 }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};
