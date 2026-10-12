import { createElement as h } from 'react';

import { buildElement } from './blog-thumbnail-render';

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
  mapLayout?: 'horizontal';
  mapLegend?: string;
  mapInsetImage?: string;
  questionRanking?: {
    subjectLines: string[];
    question: string;
    answer: string;
    year: string;
    kicker: string;
  };
  household?: {
    prefecture: string;
    city: string;
    category: string;
    comparison: string;
    value: string;
  };
  /** Ranking stories keep the article's own rank/value/gap claim; the map is decorative, not data. */
  rankingStory?: {
    kicker: string;
    subjectLines: string[];
    highlight: string;
    detail: string;
  };
  /** Practitioner series: the series name, episode and accent tell the series apart. */
  series?: { label: string; episode: string | null; accent: string };
  /** Explainer / dataset covers show one figure from the article itself (mapImage holds the figure). */
  figure?: { caption: string; aspect: number };
  /** Palette guides show swatches rendered from the D3 schemes the chapter covers (mapImage holds them). */
  swatches?: { caption: string };
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

/** 一覧の小さい表示でも主題が読める、地図付きの太字カバー。 */
export function buildBoldNoteCoverElement(data: EditorialNoteCover) {
  if (data.questionRanking) return buildQuestionRankingNoteCoverElement(data);
  if (data.rankingStory) return buildRankingStoryNoteCoverElement(data);
  if (data.series) return buildSeriesNoteCoverElement(data);
  if (data.figure || data.swatches) return buildFigureNoteCoverElement(data);
  const hh = data.household;
  const text = (value: string, style: Record<string, string | number> = {}) =>
    h('div', { style: { display: 'flex', whiteSpace: 'pre-wrap', ...style } }, value);
  const width = (value: string) =>
    [...value].reduce((sum, ch) => sum + (/^[\x00-\x7f]$/.test(ch) ? 0.55 : 1), 0);
  const lines = hh ? [] : data.headline.split('\n');
  const longest = Math.max(1, ...lines.map(width));
  const fontSize = hh
    ? 0
    : Math.min(108, Math.floor(550 / longest), Math.floor(295 / (lines.length * 1.14)));
  if (!hh && (fontSize < 42 || lines.length > 5))
    throw new Error('bold cover headline needs editorial shortening');
  const categoryNames: Record<string, string> = {
    教育: '教育費が', 食料: '食費が', 住居: '住居費が', 保健医療: '医療費が',
    '光熱・水道': '光熱・水道が', '家具・家事用品': '家具・家事用品が',
    '被服及び履物': '衣服・靴が', '交通・通信': '交通・通信が',
    教養娯楽: '教養・娯楽が',
  };
  const main = hh ? (categoryNames[hh.category] ?? `${hh.category}が`) : '';
  const mainSize = Math.min(128, Math.floor(520 / Math.max(1, width(main))));
  const valueSize = hh ? Math.min(122, Math.floor(520 / width(hh.value))) : 0;
  if (!hh) {
    return h(
      'div',
      { style: { width: 1280, height: 670, display: 'flex', position: 'relative',
        overflow: 'hidden', background: '#f7f9fe', color: '#0b2152',
        fontFamily: 'Noto Sans JP' } },
      h('img', { src: data.mapImage,
        width: data.mapLayout === 'horizontal' ? 850 : 720,
        height: data.mapLayout === 'horizontal' ? 490 : 680,
        style: data.mapLayout === 'horizontal'
          ? { position: 'absolute', left: 420, top: 70, objectFit: 'contain' }
          : { position: 'absolute', left: 555, top: -5,
              objectFit: 'contain', transform: 'rotate(-9deg)' } }),
      h('div', { style: { position: 'absolute', left: 0, top: 0,
        width: 720, height: 670,
        background: 'linear-gradient(90deg, #f7f9fe 55%, #f7f9fe00 100%)' } }),
      text(data.headline, { position: 'absolute', left: 58, top: 145,
        width: 760, whiteSpace: 'pre', fontSize, fontWeight: 900,
        lineHeight: 1.12 }),
      data.subline && data.kicker !== 'はじめまして、stats47です' ? text(data.subline, { position: 'absolute', left: 62, top: 514,
        width: 710, fontSize: 34, fontWeight: 800, lineHeight: 1.2 }) : null,
      data.mapInsetImage ? h('div', { style: { display: 'flex', position: 'absolute', left: 1041,
        top: 472, width: 158, height: 111, border: '2px solid #8caad8',
        borderRadius: 8, background: '#f7f9fe' } },
        h('img', { src: data.mapInsetImage, width: 145, height: 85,
          style: { position: 'absolute', left: 5, top: 8, objectFit: 'contain' } }),
        text('沖縄県', { position: 'absolute', left: 7, top: 86,
          fontSize: 15, fontWeight: 800, color: '#3566b2' })) : null,
      text('stats47', { position: 'absolute', left: 61, top: 600,
        fontSize: 28, fontWeight: 900 }),
      data.mapLegend ? text(data.mapLegend, { position: 'absolute', right: 55,
        top: 601, fontSize: 22, fontWeight: 700, color: '#3566b2' }) : null
    );
  }
  return h(
    'div',
    { style: { width: 1280, height: 670, display: 'flex', position: 'relative',
      overflow: 'hidden', background: '#f7f9fe', fontFamily: 'Noto Sans JP' } },
    h('div', { style: { position: 'absolute', left: 0, top: 0, width: 706,
      height: 670, background: '#0b2152' } }),
    h('div', { style: { position: 'absolute', left: 54, top: 51, width: 8,
      height: 46, background: '#82b5ff' } }),
    text(hh ? `${hh.prefecture}の家計` : data.kicker, {
      position: 'absolute', left: 82, top: 50, color: '#d4e3ff',
      fontSize: 38, fontWeight: 800, maxWidth: 570,
    }),
    hh
      ? [
          text(main, { position: 'absolute', left: 50, top: 142,
            color: '#fff', fontSize: mainSize, fontWeight: 900 }),
          text(hh.value, { position: 'absolute', left: 50, top: 317,
            color: '#8fc1ff', fontSize: valueSize, fontWeight: 900 }),
          text(`${hh.city}｜${hh.comparison.replace('より', 'と比較')}`, {
            position: 'absolute', left: 59, top: 515, color: '#fff',
            fontSize: 27, fontWeight: 700, maxWidth: 625,
          }),
        ]
      : [
          text(data.headline, { position: 'absolute', left: 50, top: 142,
            width: 630, whiteSpace: 'pre', color: '#fff', fontSize, fontWeight: 900,
            lineHeight: 1.12 }),
          text(data.subline, { position: 'absolute', left: 59, top: 515,
            width: 625, color: '#d4e3ff', fontSize: 27, fontWeight: 700 }),
        ],
    h('img', { src: data.mapImage, width: 500, height: 510,
      style: { position: 'absolute', left: 743, top: 70, objectFit: 'contain' } }),
    text(data.badge ?? (hh ? hh.city : '47 PREFECTURES'), {
      position: 'absolute', left: 762, top: 591,
      color: '#0b2152', fontSize: 26, fontWeight: 800,
    }),
    text('stats47', { position: 'absolute', left: 1124, top: 591,
      color: '#0b2152', fontSize: 27, fontWeight: 900 }),
    text(data.footnote ?? '詳しい対象・出典は記事本文へ', {
      position: 'absolute', left: 59, top: 589,
      color: '#c4d4ee', fontSize: 20,
    })
  );
}

/** Question covers use the approved light paper / warm D3 map, with no chart legend. */
export function buildQuestionRankingNoteCoverElement(data: EditorialNoteCover) {
  const copy = data.questionRanking;
  if (!copy || copy.subjectLines.length < 1 || copy.subjectLines.length > 2)
    throw new Error('question cover subject must have one or two lines');
  const units = (value: string) => [...value].reduce((sum,ch) => sum + (/^[\x00-\x7f]$/.test(ch) ? 0.65 : 1), 0);
  const isTwoLines = copy.subjectLines.length === 2;
  const subjectSize = Math.min(124, Math.floor(760 / Math.max(...copy.subjectLines.map(units))),
    Math.floor(210 / (copy.subjectLines.length * 1.12)));
  const questionSize = Math.min(isTwoLines ? 86 : 124, Math.floor(760 / units(copy.question)));
  const answerSize = Math.min(61, Math.floor(760 / units(copy.answer)));
  if (subjectSize < 60 || questionSize < 60 || answerSize < 35)
    throw new Error('question cover needs shorter editorial copy');
  const text = (value: string, left: number, top: number, size: number, color = '#0b2152') =>
    h('div', { style: { position: 'absolute', display: 'flex', whiteSpace: 'pre', left, top,
      fontSize: size, fontWeight: 900, color, lineHeight: 1.12 } }, value);
  return h('div', { style: { width: 1280, height: 670, display: 'flex', position: 'relative',
    overflow: 'hidden', background: '#faf9f5', fontFamily: 'Noto Sans JP' } },
    h('img', { src: data.mapImage, width: 1280, height: 670,
      style: { position: 'absolute', left: 0, top: 0, opacity: 0.52 } }),
    text(copy.kicker, 64, 52, 29, '#53657f'),
    text(copy.subjectLines.join('\n'), 55, 132, subjectSize),
    text(copy.question, 55, isTwoLines ? 364 : 294, questionSize),
    text(copy.answer, 63, isTwoLines ? 492 : 467, answerSize, '#aa421b'),
    text('stats47', 63, 582, 29, '#53657f'),
    text('沖縄県', 1076, 536, 16, '#9d714d'),
    text(`${copy.year}年版`, 1080, 589, 23, '#53657f'));
}

const coverUnits = (value: string) =>
  [...value].reduce((sum, ch) => sum + (/^[\x00-\x7f]$/.test(ch) ? 0.65 : 1), 0);
const positioned = (value: string, left: number, top: number, size: number,
  color: string, extra: Record<string, string | number> = {}) =>
  h('div', { style: { position: 'absolute', display: 'flex', whiteSpace: 'pre', left, top,
    fontSize: size, fontWeight: 900, color, lineHeight: 1.12, ...extra } }, value);

/** Same paper family as question covers; the map is a neutral backdrop and carries no values. */
export function buildRankingStoryNoteCoverElement(data: EditorialNoteCover) {
  const copy = data.rankingStory;
  // An explainer without its own figure reuses this layout with no highlight and up to three headline lines.
  const maxLines = copy?.highlight ? 2 : 3;
  if (!copy || copy.subjectLines.length < 1 || copy.subjectLines.length > maxLines)
    throw new Error('ranking story subject must have one or two lines (three without a highlight)');
  const lines = copy.subjectLines.length;
  const subjectSize = Math.min(118, Math.floor(700 / Math.max(...copy.subjectLines.map(coverUnits))),
    Math.floor((copy.highlight ? 230 : 300) / (lines * 1.12)));
  const highlightSize = copy.highlight ? Math.min(84, Math.floor(720 / coverUnits(copy.highlight))) : 0;
  const detailSize = Math.min(38, Math.floor(720 / coverUnits(copy.detail)));
  if (subjectSize < 64 || (copy.highlight && highlightSize < 50) || detailSize < 28)
    throw new Error('ranking story cover needs shorter editorial copy');
  const highlightTop = 128 + Math.round(lines * subjectSize * 1.12) + 30;
  const detailTop = copy.highlight ? highlightTop + Math.round(highlightSize * 1.2) + 16 : highlightTop;
  return h('div', { style: { width: 1280, height: 670, display: 'flex', position: 'relative',
    overflow: 'hidden', background: '#faf9f5', fontFamily: 'Noto Sans JP' } },
    h('img', { src: data.mapImage, width: 1280, height: 670,
      style: { position: 'absolute', left: 0, top: 0, opacity: 0.6 } }),
    positioned(copy.kicker, 64, 52, 29, '#53657f'),
    positioned(copy.subjectLines.join('\n'), 55, 128, subjectSize, '#0b2152'),
    copy.highlight ? positioned(copy.highlight, 60, highlightTop, highlightSize, '#aa421b') : null,
    positioned(copy.detail, 63, detailTop, detailSize, '#0b2152', { fontWeight: 800 }),
    positioned('stats47', 63, 582, 29, '#53657f'),
    positioned('沖縄県', 1076, 536, 16, '#7d8ea3'));
}

/** Dark series cover: label, episode number and accent colour distinguish the practitioner series. */
export function buildSeriesNoteCoverElement(data: EditorialNoteCover) {
  const series = data.series;
  if (!series) throw new Error('series cover needs series');
  const lines = data.headline.split('\n');
  const size = Math.min(104, Math.floor(1000 / Math.max(...lines.map(coverUnits))),
    Math.floor(300 / (lines.length * 1.14)));
  if (size < 52 || lines.length > 3) throw new Error('series cover headline needs editorial shortening');
  const headlineTop = lines.length === 3 ? 150 : 178;
  const ruleTop = headlineTop + Math.round(lines.length * size * 1.14) + 26;
  return h('div', { style: { width: 1280, height: 670, display: 'flex', position: 'relative',
    overflow: 'hidden', background: '#0f1a2b', fontFamily: 'Noto Sans JP' } },
    h('div', { style: { position: 'absolute', left: 860, top: -260, width: 720, height: 720,
      borderRadius: 360, background: series.accent, opacity: 0.07 } }),
    h('div', { style: { position: 'absolute', left: 0, top: 0, width: 1280, height: 10,
      background: series.accent } }),
    h('div', { style: { position: 'absolute', left: 60, top: 64, width: 10, height: 40,
      background: series.accent } }),
    positioned(series.label, 86, 62, 30, series.accent, { fontWeight: 800 }),
    series.episode ? positioned(series.episode, 1010, 40, 120, series.accent, { opacity: 0.85 }) : null,
    positioned(data.headline, 58, headlineTop, size, '#ffffff', { lineHeight: 1.14 }),
    h('div', { style: { position: 'absolute', left: 62, top: ruleTop, width: 120, height: 8,
      background: series.accent } }),
    positioned('stats47', 62, 584, 30, '#c9d4e6'),
    positioned(data.footnote ?? '手順と注意点は記事本文へ', 830, 592, 22, '#8c9bb3', { fontWeight: 700 }));
}

/** Paper cover with one figure from the article (or rendered palette swatches) on the right. */
export function buildFigureNoteCoverElement(data: EditorialNoteCover) {
  const lines = data.headline.split('\n');
  const size = Math.min(80, Math.floor(520 / Math.max(...lines.map(coverUnits))),
    Math.floor(290 / (lines.length * 1.14)));
  if (size < 44 || lines.length > 3) throw new Error('figure cover headline needs editorial shortening');
  const caption = data.figure?.caption ?? data.swatches?.caption ?? '';
  const aspect = data.figure?.aspect ?? 1;
  const imageWidth = Math.min(560, Math.floor(470 * aspect));
  const imageHeight = Math.round(imageWidth / aspect);
  const sublineTop = 140 + Math.round(lines.length * size * 1.14) + 28;
  return h('div', { style: { width: 1280, height: 670, display: 'flex', position: 'relative',
    overflow: 'hidden', background: '#faf9f5', fontFamily: 'Noto Sans JP' } },
    h('div', { style: { position: 'absolute', left: 54, top: 56, width: 8, height: 36,
      background: data.accent ?? '#ed623d' } }),
    positioned(data.kicker, 76, 54, 28, '#53657f', { fontWeight: 800 }),
    positioned(data.headline, 54, 140, size, '#0b2152', { lineHeight: 1.14 }),
    data.subline ? h('div', { style: { position: 'absolute', display: 'flex', left: 58, top: sublineTop,
      width: 540, fontSize: 28, fontWeight: 700, color: '#33445e', lineHeight: 1.35 } }, data.subline) : null,
    h('div', { style: { position: 'absolute', left: 640, top: 52, width: 592, height: 540,
      borderRadius: 18, background: '#ffffff', border: '2px solid #e4dfd3' } }),
    h('img', { src: data.mapImage, width: imageWidth, height: imageHeight,
      style: { position: 'absolute', left: 656 + Math.round((560 - imageWidth) / 2),
        top: 68 + Math.round((470 - imageHeight) / 2), objectFit: 'contain' } }),
    positioned(caption, 664, 548, 20, '#7d8ea3', { fontWeight: 700 }),
    positioned('stats47', 58, 584, 29, '#53657f'));
}
