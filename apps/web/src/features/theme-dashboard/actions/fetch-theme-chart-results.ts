'use server';

import type { PageComponent } from '@/components/stat-charts';

import {
  loadThemeChartResult,
  type ThemeChartLoadResult,
} from '../lib/theme-chart-result';

export interface ThemeChartRequest {
  chart: PageComponent;
  prefCode: string;
}

/** 1 回で受け付ける要求の上限 (クライアントの MAX_BATCH_SIZE と同じ値) */
const MAX_BATCH_REQUESTS = 60;

/**
 * テーマのグラフを複数まとめて解決する Server Action。結果は要求と同じ順。
 * グラフごとに呼ぶとブラウザ側で一列に並ぶため束ねる (`lib/action-batcher.ts`)。
 */
export async function fetchThemeChartResultsAction(
  requests: ThemeChartRequest[]
): Promise<ThemeChartLoadResult[]> {
  if (!Array.isArray(requests) || requests.length > MAX_BATCH_REQUESTS) {
    throw new Error(`グラフの一括取得は 1 回 ${MAX_BATCH_REQUESTS} 件まで`);
  }
  return Promise.all(
    requests.map((request) => loadThemeChartResult(request.chart, request.prefCode))
  );
}
