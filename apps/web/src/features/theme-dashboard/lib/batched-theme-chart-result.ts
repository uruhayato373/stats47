import type { PageComponent } from '@/components/stat-charts';

import {
  fetchThemeChartResultsAction,
  type ThemeChartRequest,
} from '../actions/fetch-theme-chart-results';

import { createActionBatcher } from './action-batcher';

import type { ThemeChartLoadResult } from './theme-chart-result';


const batched = createActionBatcher<ThemeChartRequest, ThemeChartLoadResult>(
  fetchThemeChartResultsAction,
  ({ chart, prefCode }) =>
    [chart.componentType, chart.componentKey ?? chart.componentProps ?? '', prefCode].join('\u0000'),
);

/**
 * テーマのグラフのデータを取る (クライアント用)。同じ描画で出た要求は 1 回のサーバーアクションに束ねる。
 * 通信そのものが失敗しても、1 件ずつ取っていたときと同じく「取得できない」状態を返す。
 */
export function loadThemeChartResultBatched(
  chart: PageComponent,
  prefCode: string,
): Promise<ThemeChartLoadResult> {
  return batched({ chart, prefCode }).catch(() => ({ state: 'source-unavailable' as const }));
}
