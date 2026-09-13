import { buildElement } from './blog-thumbnail-render';
import { createElement as h } from 'react';

export function buildNoteCoverElement(title: string) {
  return buildElement(
    {
      title,
      subtitle: null,
      category: 'NOTE',
      domainPath: 'note.com/stats47',
    },
    false
  );
}

export interface EditorialNoteCover {
  kicker: string;
  headline: string;
  subline: string;
  mapImage: string;
  badge?: string;
  footnote?: string;
  accent?: string;
  household?: {
    prefecture: string;
    city: string;
    category: string;
    comparison: string;
    value: string;
  };
}

/** note公開用1280×670。地理・数値は呼出元の検証済み入力から固定描画する。 */
export function buildEditorialNoteCoverElement(data: EditorialNoteCover) {
  const accent = data.accent ?? '#ed623d';
  const text = (value: string, style: Record<string, string | number> = {}) =>
    h(
      'div',
      {
        style: { display: 'flex', whiteSpace: 'pre-wrap', ...style },
      },
      value
    );
  const lines = data.headline.split('\n');
  const longest = Math.max(
    ...lines.map((line) =>
      [...line].reduce(
        (sum, ch) => sum + (/^[\x00-\x7f]$/.test(ch) ? 0.55 : 1),
        0
      )
    )
  );
  const fontSize = Math.min(
    78,
    Math.floor(640 / Math.max(longest, 1)),
    Math.floor(292 / (lines.length * 1.2))
  );
  if (!data.household && (fontSize < 40 || lines.length > 5))
    throw new Error('cover headline needs editorial shortening');
  const hh = data.household;
  return h(
    'div',
    {
      style: {
        width: 1280,
        height: 670,
        display: 'flex',
        position: 'relative',
        background: '#faf9f5',
        color: '#142f42',
        fontFamily: 'Noto Sans JP',
        overflow: 'hidden',
      },
    },
    h('div', {
      style: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: 480,
        height: 670,
        background: '#e4eef0',
      },
    }),
    h(
      'div',
      {
        style: {
          position: 'absolute',
          left: 64,
          top: 55,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        },
      },
      h('div', { style: { width: 12, height: 32, background: accent } }),
      text(data.kicker, { fontSize: 29, fontWeight: 700 })
    ),
    h(
      'div',
      {
        style: {
          position: 'absolute',
          left: 64,
          top: hh ? 129 : 148,
          width: 686,
          display: 'flex',
          flexDirection: 'column',
        },
      },
      ...(hh
        ? [
            text(hh.prefecture, {
              fontSize: 103,
              fontWeight: 900,
              lineHeight: 1.12,
            }),
            text(`${hh.city}の家計`, { fontSize: 34, marginTop: 12 }),
            text(`${hh.category}への支出`, {
              fontSize: 44,
              fontWeight: 700,
              marginTop: 29,
            }),
            text(hh.comparison, { fontSize: 31, marginTop: 8 }),
            text(hh.value, {
              fontSize: 76,
              fontWeight: 900,
              color: accent,
              lineHeight: 1.14,
            }),
          ]
        : [
            text(data.headline, { fontSize, fontWeight: 900, lineHeight: 1.2 }),
            text(data.subline, {
              fontSize: data.subline.length > 27 ? 27 : 30,
              marginTop: 28,
              lineHeight: 1.5,
            }),
          ])
    ),
    h('img', {
      src: data.mapImage,
      width: 438,
      height: 410,
      style: {
        position: 'absolute',
        left: 812,
        top: 125,
        objectFit: 'contain',
      },
    }),
    hh
      ? text('調査対象は都市単位', {
          position: 'absolute',
          left: 861,
          top: 546,
          fontSize: 20,
          color: '#587484',
        })
      : null,
    data.badge
      ? text(data.badge, {
          position: 'absolute',
          left: 834,
          top: 67,
          color: '#24597a',
          fontSize: 29,
          fontWeight: 700,
        })
      : null,
    h(
      'div',
      {
        style: {
          position: 'absolute',
          left: 64,
          bottom: 64,
          width: 1152,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      },
      text('stats47', { fontSize: 30, fontWeight: 900 }),
      text(data.footnote ?? '統計の年・対象・出典は記事本文へ', {
        fontSize: 20,
        color: '#587484',
      })
    )
  );
}
