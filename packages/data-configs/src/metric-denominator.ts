/**
 * 指標の値が何で割られているか。`unit` は「人」のままなので (分母は表示で二重にしない)、機械はここで判定する。
 *
 * 明示の `denominator` を先に見て、無ければキーと題名から読む。2026-09-24 に人口10万対の 3 指標が
 * 実数の列を指す誤りがあり、分母が文字列にしか無いので機械は気づけなかった。
 */
import type { MetricConfig, MetricDenominator } from './types';

const POPULATION_KEY = /(^|-)per-(100k|10k|1000|1k|capita|million|person|resident|taxpayer)(-|$)/;
const AREA_KEY = /(^|-)per-(km2|100km2|ha|1000-km|km)(-|$)/;
const HOUSEHOLD_KEY = /(^|-)per-household(-|$)/;
const POPULATION_TEXT = /人口.*(当たり|あたり|万対|千対)|(万|千)人(当たり|あたり)|(1|１)人(当たり|あたり)|人口(10|100)?万対/;
const AREA_TEXT = /(km|ｋｍ|面積).*(当たり|あたり)/;
const HOUSEHOLD_TEXT = /世帯.*(当たり|あたり)/;

type MetricLabels = Pick<MetricConfig, 'key' | 'title' | 'subtitle' | 'denominator'>;

/** キー名が名乗る分母 */
const denominatorInKey = (key: string): MetricDenominator | null =>
  HOUSEHOLD_KEY.test(key) ? 'household' : AREA_KEY.test(key) ? 'area' : POPULATION_KEY.test(key) ? 'population' : null;

/** 題名と補足が名乗る分母 */
const denominatorInText = ({ title, subtitle }: MetricLabels): MetricDenominator | null => {
  const text = `${title} ${subtitle ?? ''}`;
  return POPULATION_TEXT.test(text) ? 'population' : AREA_TEXT.test(text) ? 'area' : HOUSEHOLD_TEXT.test(text) ? 'household' : null;
};

/** 指標の分母。分からなければ null */
export function metricDenominatorOf(metric: MetricLabels): MetricDenominator | null {
  return metric.denominator ?? denominatorInText(metric) ?? denominatorInKey(metric.key);
}

/** キー名が分母を名乗るのに題名も明示も無い指標。中身が実数なのに per-100k を名乗る、といった食い違いを止める */
export function metricDenominatorProblem(metric: MetricLabels): string | null {
  const inKey = denominatorInKey(metric.key);
  if (!inKey || metric.denominator || denominatorInText(metric)) return null;
  return `${metric.key}: キー名は分母 (${inKey}) を名乗るのに、題名・補足・denominator のどれにも書かれていない`;
}
