'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { usePathname } from 'next/navigation';

import { isOk } from '@stats47/types';

import type { AreaType } from '@/features/area';

import {
  trackRankingView,
  trackUiInteraction,
  trackYearChange,
} from '@/lib/analytics/events';

import { fetchNationalAverageSeriesAction } from '../../actions/fetch-national-average-series';
import { fetchRankingValuesAction } from '../../actions/fetch-ranking-values';
import { supportedRankingNormalization } from '../../utils/resolve-ranking-presentation';

import type { NationalAveragePoint } from '../../lib/build-national-average-series';
import type { RankingItem, RankingValue } from '@stats47/ranking';

interface UseRankingPageStateParams {
  rankingKey: string;
  rankingItem: RankingItem;
  initialRankingValues: RankingValue[];
  /** サーバーが全年 values から畳んだ総数ベースの全国平均系列 */
  initialNationalAverageSeries: NationalAveragePoint[];
  areaType: AreaType;
  selectedYear?: string;
}

export function useRankingPageState({
  rankingKey,
  rankingItem,
  initialRankingValues,
  initialNationalAverageSeries,
  areaType,
  selectedYear,
}: UseRankingPageStateParams) {
  const [display, setDisplay] = useState({
    rankingValues: initialRankingValues,
    nationalAverageSeries: initialNationalAverageSeries,
    currentYear: selectedYear ?? '',
    normalizationType: undefined as string | undefined,
  });
  const {
    rankingValues,
    nationalAverageSeries,
    currentYear,
    normalizationType,
  } = display;
  const latestRequest = useRef(0);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  // 地域の単位はページが決める (都道府県と市区町村は別のページ。切り替えは RankingAreaUnitSwitch のリンク)
  const currentAreaType = areaType;
  const activeRankingItem = rankingItem;

  /**
   * 計算方法に対応した全国平均系列を解決する。
   * 総数はサーバー seed をそのまま使い再取得しない (系列は年度非依存)。
   * 正規化版スナップショットが無い指標は空配列 = 推移非表示に degrade する。
   */
  const resolveSeries = async (norm?: string): Promise<NationalAveragePoint[]> => {
    if (!norm) return initialNationalAverageSeries;
    const result = await fetchNationalAverageSeriesAction(
      rankingKey,
      areaType,
      norm
    );
    return isOk(result) ? result.data : [];
  };

  /**
   * 値と系列を 1 つの transition でまとめて差し替える。
   * 別々に setState すると「数値=10万人あたり / 線=総数」の中間フレームが出る。
   */
  const applyValuesAndSeries = async (
    year: string,
    norm: string | undefined,
    { syncSeries }: { syncSeries: boolean }
  ) => {
    const request = ++latestRequest.current;
    const [valuesResult, series] = await Promise.all([
      fetchRankingValuesAction(rankingKey, areaType, year, norm),
      syncSeries ? resolveSeries(norm) : Promise.resolve(null),
    ]);
    if (request !== latestRequest.current) return;
    if (!isOk(valuesResult)) {
      window.history.replaceState(
        null,
        '',
        buildUrl(currentYear, normalizationType)
      );
      return;
    }
    // 別の指標の見方 (series) は、選んだ年の値が無いとその系列の直近の年を返す。表示する年を値の年に合わせる
    const valuesYear = valuesResult.data[0]?.yearCode;
    const shownYear = norm && valuesYear && valuesYear.slice(0, 4) !== year.slice(0, 4) ? valuesYear : year;
    // Values, labels and scale policy become visible as one committed result.
    setDisplay((previous) => ({
      rankingValues: valuesResult.data,
      nationalAverageSeries: series ?? previous.nationalAverageSeries,
      currentYear: shownYear,
      normalizationType: norm,
    }));
  };

  const buildUrl = (year: string, norm?: string) => {
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (norm) params.set('norm', norm);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  useEffect(() => {
    trackRankingView({
      rankingKey,
      title: rankingItem.title,
      categoryKey: rankingItem.categoryKey,
      areaType: currentAreaType,
      yearCode: currentYear,
    });
  }, [rankingKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleYearChange = (newYear: string) => {
    trackYearChange({ rankingKey, fromYear: currentYear, toYear: newYear });
    trackUiInteraction({ action: 'year_change', target: 'chart' });
    window.history.replaceState(
      null,
      '',
      buildUrl(newYear, normalizationType)
    );
    startTransition(async () => {
      // 系列は年度非依存なので再取得しない
      await applyValuesAndSeries(newYear, normalizationType, {
        syncSeries: false,
      });
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlYear = params.get('year');
    const urlNorm = supportedRankingNormalization(
      rankingItem,
      params.get('norm') ?? undefined
    );
    if (params.has('norm') && !urlNorm) {
      params.delete('norm');
      const qs = params.toString();
      window.history.replaceState(
        null,
        '',
        qs ? `${pathname}?${qs}` : pathname
      );
    }

    const nextYear = urlYear || selectedYear || currentYear;
    if (nextYear && (nextYear !== currentYear || urlNorm)) {
      startTransition(async () => {
        await applyValuesAndSeries(nextYear, urlNorm, {
          syncSeries: true,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNormalizationChange = (value: string) => {
    trackUiInteraction({ action: 'basis_change', target: 'chart' });
    const nextType = supportedRankingNormalization(activeRankingItem, value);

    const params = new URLSearchParams(window.location.search);
    if (nextType) {
      params.set('norm', nextType);
    } else {
      params.delete('norm');
    }
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `${pathname}?${qs}` : pathname);

    startTransition(async () => {
      if (!currentYear) return;
      await applyValuesAndSeries(currentYear, nextType, {
        syncSeries: true,
      });
    });
  };

  return {
    activeRankingItem,
    currentAreaType,
    currentYear,
    handleNormalizationChange,
    handleYearChange,
    isPending,
    nationalAverageSeries,
    normalizationType,
    rankingValues,
  };
}
