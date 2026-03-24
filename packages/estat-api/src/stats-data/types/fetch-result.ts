import type { EstatStatsDataResponse } from './stats-data-response';

export type StatsDataSource = 'r2' | 'api';

export type FetchStatsDataResult = {
  readonly data: EstatStatsDataResponse;
  readonly source: StatsDataSource;
};
