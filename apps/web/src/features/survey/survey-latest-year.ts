/**
 * 調査ハブの見出しに出す最新年。
 *
 * 指標の最新年の最大をそのまま出すと、原典が複数ある指標 (総人口は国勢調査と人口推計) の年が、その調査の最新回に読める
 * (2026-09-25 の UI 全面点検: 国勢調査のページに「最新 2024 年」。SURVEY-PAGES-01)。毎年でない調査は、編集情報の実施周期
 * (`surveyCycle`) を使い、掲載データの年のうち実施年に当たる年だけから出す。実施周期を持たない調査は掲載データの最新年を返す。
 */
import type { SurveyCycle } from './survey-editorial';

interface SurveyYearSource {
  latestYear: unknown;
  availableYears?: unknown;
}

const YEAR_CODE = /^\d{4}$/;

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function yearCodeOf(value: unknown): string | null {
  const parsed = parseJson(value);
  if (typeof parsed !== 'object' || parsed === null || !('yearCode' in parsed)) return null;
  const { yearCode } = parsed;
  return typeof yearCode === 'string' && YEAR_CODE.test(yearCode) ? yearCode : null;
}

function yearCodesOf(item: SurveyYearSource): string[] {
  const available = parseJson(item.availableYears);
  return [item.latestYear, ...(Array.isArray(available) ? available : [])]
    .map(yearCodeOf)
    .filter((yearCode): yearCode is string => yearCode !== null);
}

function isSurveyYear(yearCode: string, cycle: SurveyCycle): boolean {
  return (Number(yearCode) - cycle.anchorYear) % cycle.intervalYears === 0;
}

/** 見出しに出す最新年 (4 桁)。出せる年が無ければ null (見出しに年を出さない)。 */
export function surveyLatestYear(
  items: readonly SurveyYearSource[],
  cycle?: SurveyCycle
): string | null {
  const yearCodes = cycle
    ? items.flatMap(yearCodesOf).filter((yearCode) => isSurveyYear(yearCode, cycle))
    : items.map((item) => yearCodeOf(item.latestYear)).filter((yearCode): yearCode is string => yearCode !== null);
  return yearCodes.sort().at(-1) ?? null;
}
