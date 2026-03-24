import type { StatsSchema } from '@stats47/types';
import type { EstatStatsDataResponse } from '../../types/stats-data-response';

export const mockEstatResponse: EstatStatsDataResponse = {
  GET_STATS_DATA: {
    RESULT: { STATUS: 0, ERROR_MSG: '' },
    PARAMETER: {
      LANG: "ja",
      STATS_DATA_ID: "0003433228",
    },
    STATISTICAL_DATA: {
      TABLE_INF: {
        '@id': '0003433228',
        STAT_NAME: { $: '国勢調査', '@code': '00200521' },
        TITLE: { $: '人口', '@code': '001' },
        GOV_ORG: { $: '総務省', '@code': '00200' },
        STATISTICS_NAME: '国勢調査',
        SURVEY_DATE: '2020000000',
        OPEN_DATE: '2021-01-01',
        SMALL_AREA: '0',
        COLLECT_AREA: '全国',
        CYCLE: '5年',
        UPDATED_DATE: '2021-01-01',
      },
      CLASS_INF: { CLASS_OBJ: [] },
      DATA_INF: { VALUE: [], NOTE: [] },
    },
  },
};

export const mockStatsSchemas: StatsSchema[] = [
  {
    areaCode: '13000',
    areaName: '東京都',
    yearCode: '2024',
    yearName: '2024年',

    categoryCode: 'A01',
    categoryName: '総人口',
    value: 14000000,
    unit: '人',
  },
  {
    areaCode: '14000',
    areaName: '神奈川県',
    yearCode: '2024',
    yearName: '2024年',

    categoryCode: 'A01',
    categoryName: '総人口',
    value: 9200000,
    unit: '人',
  },
];
