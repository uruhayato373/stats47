import { createElement as h } from 'react';

import { RANKING_THUMBNAIL_SIZE } from '@stats47/ranking';

import type { createElement } from 'react';

export interface RankingThumbnailRenderData {
  title: string;
  year: string;
  unit: string;
  topAreaName: string;
  topValue: string;
  mapSvg: string;
}

export function formatRankingThumbnailValue(value: number): string {
  return value.toLocaleString('ja-JP');
}

export function buildRankingThumbnailElement(
  data: RankingThumbnailRenderData,
  dark: boolean
): ReturnType<typeof createElement> {
  const background = dark ? '#0f172a' : '#ffffff';
  const foreground = dark ? '#f8fafc' : '#0f172a';
  const muted = dark ? '#94a3b8' : '#64748b';
  const border = dark ? '#334155' : '#cbd5e1';
  const primary = dark ? '#818cf8' : '#3048cc';
  const mapDataUri = `data:image/svg+xml;base64,${Buffer.from(data.mapSvg).toString('base64')}`;

  return h(
    'div',
    {
      style: {
        width: RANKING_THUMBNAIL_SIZE.width,
        height: RANKING_THUMBNAIL_SIZE.height,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        background,
        color: foreground,
        border: `1px solid ${border}`,
        fontFamily: '"Noto Sans JP", sans-serif',
      },
    },
    h('img', {
      src: mapDataUri,
      width: 430,
      height: 290,
      style: {
        position: 'absolute',
        right: 8,
        bottom: 6,
        width: 430,
        height: 290,
        objectFit: 'contain',
      },
    }),
    h(
      'div',
      {
        style: {
          position: 'absolute',
          left: 28,
          top: 24,
          right: 28,
          display: 'flex',
          fontSize: 28,
          lineHeight: 1.3,
          fontWeight: 900,
        },
      },
      data.title
    ),
    h(
      'div',
      {
        style: {
          position: 'absolute',
          left: 28,
          top: 116,
          display: 'flex',
          flexDirection: 'column',
          background,
          paddingRight: 12,
        },
      },
      h(
        'div',
        { style: { display: 'flex', color: muted, fontSize: 14 } },
        '1位'
      ),
      h(
        'div',
        { style: { display: 'flex', fontSize: 22, fontWeight: 800 } },
        data.topAreaName
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'baseline',
            color: primary,
            marginTop: 4,
          },
        },
        h('span', { style: { fontSize: 30, fontWeight: 900 } }, data.topValue),
        h(
          'span',
          { style: { fontSize: 13, fontWeight: 700, marginLeft: 4 } },
          data.unit
        )
      )
    ),
    h(
      'div',
      {
        style: {
          position: 'absolute',
          left: 28,
          bottom: 20,
          display: 'flex',
          color: muted,
          fontSize: 13,
        },
      },
      `${data.year}年`
    )
  );
}
