import {
  fetchMetricTimeseriesBatchAction,
  type MetricTimeseriesRequest,
  type MetricTimeseriesResult,
} from '../actions/fetch-metric-timeseries';

import { createActionBatcher } from './action-batcher';

const batched = createActionBatcher<MetricTimeseriesRequest, MetricTimeseriesResult>(
  fetchMetricTimeseriesBatchAction,
  (request) => `${request.rankingKey}\u0000${request.areaCode}`,
);

/**
 * 指標の時系列を取る (クライアント用)。同じ描画で出た要求は 1 回のサーバーアクションに束ねる。
 * 理由は `action-batcher.ts` を参照。
 */
export function fetchMetricTimeseriesBatched(
  rankingKey: string,
  areaCode: string,
): Promise<MetricTimeseriesResult> {
  return batched({ rankingKey, areaCode });
}
