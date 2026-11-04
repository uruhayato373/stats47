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
const PER_PERSON_TEXT = /(万|千|1|１)人(当たり|あたり)/;
const PER_WORDS = ['当たり', 'あたり'];
const POPULATION_PER_WORDS = [...PER_WORDS, '万対', '千対'];

/** subjects のどれかより後ろに perWords のどれかがあるか。`.*` の正規表現は長い入力で遅くなるので文字列で探す */
const hasPerWordAfter = (text: string, subjects: readonly string[], perWords: readonly string[]): boolean => {
  const starts = subjects.map((subject) => text.indexOf(subject)).filter((index) => index >= 0);
  if (starts.length === 0) return false;
  const from = Math.min(...starts);
  return perWords.some((word) => text.indexOf(word, from) >= 0);
};

type MetricLabels = Pick<MetricConfig, 'key' | 'title' | 'subtitle' | 'denominator'>;

/** キー名が名乗る分母 */
const denominatorInKey = (key: string): MetricDenominator | null =>
  HOUSEHOLD_KEY.test(key) ? 'household' : AREA_KEY.test(key) ? 'area' : POPULATION_KEY.test(key) ? 'population' : null;

/** 題名と補足が名乗る分母 */
const denominatorInText = ({ title, subtitle }: MetricLabels): MetricDenominator | null => {
  const text = `${title} ${subtitle ?? ''}`;
  if (hasPerWordAfter(text, ['人口'], POPULATION_PER_WORDS) || PER_PERSON_TEXT.test(text)) return 'population';
  if (hasPerWordAfter(text, ['km', 'ｋｍ', '面積'], PER_WORDS)) return 'area';
  return hasPerWordAfter(text, ['世帯'], PER_WORDS) ? 'household' : null;
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
