'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { MetricTimeseriesResult } from '../actions';
import type { InitialThemeData } from '../lib/initial-theme-data';
import type { ThemeChartLoadResult } from '../lib/theme-chart-result';

/**
 * サーバーが初回描画で渡したデータ (指標カードの時系列と、章の図の結果)。
 *
 * 指標カードと章の図は、表示直後にデータを Server Action (ページ URL への POST) で取りに行っていた。
 * Google の描画もその POST を出すため、ページ 1 回の取得がクロール 2〜3 回分になる
 * (GSC のクロール統計で確認。backlog `GSC-CRAWL-WASTE-01`)。初回に表示する地域の分はここから読み、
 * 県を切り替えたときだけ取りに行く。
 */
const InitialThemeDataContext = createContext<InitialThemeData | null>(null);

export function InitialThemeDataProvider({
  value,
  children,
}: {
  value: InitialThemeData | undefined;
  children: ReactNode;
}) {
  return (
    <InitialThemeDataContext.Provider value={value ?? null}>
      {children}
    </InitialThemeDataContext.Provider>
  );
}

/** 初回描画で渡された時系列を、(指標, 地域) → 結果 の関数として返す。無ければ undefined */
export function useInitialMetricTimeseries(): (
  metricKey: string,
  areaCode: string
) => MetricTimeseriesResult | undefined {
  const initial = useContext(InitialThemeDataContext);
  return (metricKey, areaCode) => initial?.timeseries[metricKey]?.[areaCode];
}

/** 初回描画で渡された図の結果を、(図のキー, 地域) → 結果 の関数として返す。無ければ undefined */
export function useInitialThemeChartResult(): (
  componentKey: string | undefined,
  areaCode: string
) => ThemeChartLoadResult | undefined {
  const initial = useContext(InitialThemeDataContext);
  return (componentKey, areaCode) =>
    componentKey && initial?.areaCode === areaCode ? initial.chartResults[componentKey] : undefined;
}
