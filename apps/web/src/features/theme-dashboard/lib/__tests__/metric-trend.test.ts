import { describe, expect, it } from 'vitest';

import { nationalSeriesName, resolveMetricTrend, shouldFetchMetricTrend } from '../metric-trend';

/**
 * 数値タイルに推移を添えるかの判定 (2026-10-29)。
 *
 * 指標ごとのフラグで持たず、観測値と章の構成から決める。守りたいのは:
 *  (a) 47都道府県の表示では取りに行かない (値が 1 位の県の値なので、推移が何の推移か分からない)
 *  (b) 同じ章の詳しい図が描く指標は取りに行かない (同じ推移を 2 回出さない)
 *  (c) 異なる年が 2 つ以上あるときだけ描く。単年・空は何も置かない
 *  (d) 県の系列が空なら 全国 → 47 県平均 の順に代え、平均を「全国」と呼ばない
 */

const pts = (years: string[]) => years.map((year, i) => ({ year, yearName: `${year}年`, value: i + 1 }));

describe('shouldFetchMetricTrend', () => {
  it('県を選んでいて、章の図が描いていないときだけ取りに行く', () => {
    expect(shouldFetchMetricTrend({ selectedPrefectureCode: '13000', coveredByChapterChart: false })).toBe(true);
  });
  it('(a) 47都道府県 (未選択) では取りに行かない', () => {
    expect(shouldFetchMetricTrend({ selectedPrefectureCode: null, coveredByChapterChart: false })).toBe(false);
  });
  it('(b) 同じ章の図が描く指標は取りに行かない', () => {
    expect(shouldFetchMetricTrend({ selectedPrefectureCode: '13000', coveredByChapterChart: true })).toBe(false);
  });
});

describe('resolveMetricTrend', () => {
  const base = { areaName: '東京都', fallbackSeries: [] as { year: number; value: number }[] };

  it('自地域と全国が両方届くまでは描かない (代わりの系列で先に描いて差し替えない)', () => {
    expect(resolveMetricTrend({ ...base, areaResult: { points: pts(['2020', '2021']), source: 'area' }, nationalResult: undefined }))
      .toEqual({ kind: 'none' });
  });

  it('(c) 異なる年が 2 つ以上なら自地域の名前で描く', () => {
    const trend = resolveMetricTrend({
      ...base,
      areaResult: { points: pts(['2020', '2021']), source: 'area' },
      nationalResult: { points: [], source: 'none' },
    });
    expect(trend).toEqual({ kind: 'chart', seriesName: '東京都', points: [{ year: 2020, value: 1 }, { year: 2021, value: 2 }] });
  });

  it('(c) 単年は描かない (同じ年が重なっても 1 年は 1 年)', () => {
    for (const years of [['2020'], ['2020', '2020']]) {
      expect(resolveMetricTrend({ ...base, areaResult: { points: pts(years), source: 'area' }, nationalResult: { points: [], source: 'none' } }))
        .toEqual({ kind: 'none' });
    }
  });

  it('(d) 県が空なら全国で代える。全国の申告が平均なら「都道府県平均」と呼ぶ', () => {
    const national = resolveMetricTrend({
      ...base,
      areaResult: { points: [], source: 'none' },
      nationalResult: { points: pts(['2020', '2021']), source: 'national' },
    });
    expect(national.kind === 'chart' && national.seriesName).toBe('全国');
    const average = resolveMetricTrend({
      ...base,
      areaResult: { points: [], source: 'none' },
      nationalResult: { points: pts(['2020', '2021']), source: 'average' },
    });
    expect(average.kind === 'chart' && average.seriesName).toBe('都道府県平均');
  });

  it('(d) 県も全国も空ならカードの 47 県平均で代え、「全国」と呼ばない', () => {
    const trend = resolveMetricTrend({
      areaName: '東京都',
      areaResult: { points: [], source: 'none' },
      nationalResult: { points: [], source: 'none' },
      fallbackSeries: [{ year: 2020, value: 5 }, { year: 2021, value: 6 }],
    });
    expect(trend).toEqual({ kind: 'chart', seriesName: '都道府県平均', points: [{ year: 2020, value: 5 }, { year: 2021, value: 6 }] });
  });

  it('nationalSeriesName は申告が national のときだけ「全国」', () => {
    expect(nationalSeriesName({ points: [], source: 'national' })).toBe('全国');
    expect(nationalSeriesName(undefined)).toBe('都道府県平均');
  });
});
