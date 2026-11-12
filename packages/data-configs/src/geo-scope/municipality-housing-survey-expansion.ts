import data from '../../../../data/municipalities/catalog/housing-survey-expansion.json';

/**
 * 社会・人口統計体系 (SSDS) 以外の e-Stat 表から足す市区町村指標: 令和5年住宅・土地統計調査 (2026-10-28)。
 * 記録の正本は台帳 `municipalities.housing-survey-expansion` (data/municipalities/catalog/housing-survey-expansion.json + Schema。
 * 判定の記録と candidate → published の手順は Schema の description と notes)。`municipality-catalog.ts` が読む。
 */
export const MUNICIPALITY_HOUSING_SURVEY_KEYS: readonly string[] = data.keys;

export const MUNICIPALITY_HOUSING_SURVEY_STATUS = data.status as 'candidate' | 'published';

export const MUNICIPALITY_HOUSING_SURVEY_CANDIDATE_REASON: string = data.candidateReason;

export const MUNICIPALITY_HOUSING_SURVEY_THEME: {
  readonly slug: string;
  readonly title: string;
  readonly defaultMetricKey: string;
} = data.theme;
