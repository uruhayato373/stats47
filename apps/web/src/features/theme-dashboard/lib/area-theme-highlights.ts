import { isNationalAreaCode } from "@stats47/area/area-code";
import { formatUnitForDisplay, type AuthoredDisplay } from "@stats47/data-configs/unit";

import {
  formatMetricValue,
  metricDisplayUnit,
  type MetricValueDisplay,
  resolveMetricValueDisplay,
} from "../components/metric-kpi";

interface AreaThemeHighlightSource {
  indicatorDataMap: Record<
    string,
    {
      rankingItem: { unit: string; valueDisplay?: AuthoredDisplay | null };
      rankingValues: Array<{
        areaCode: string;
        value: number | null;
        unit: string;
        yearName: string;
        rank?: number | null;
      }>;
    }
  >;
}

export interface AreaThemeHighlight {
  key: string;
  title: string;
  value: number;
  unit: string;
  yearName: string;
  /** 47 都道府県の中の順位 (配信値の rank。無ければ null) */
  rank: number | null;
  /** 値の書き方。指標カードの数値タイルと同じ単位・倍率・小数桁 (UNIT-NOTATION-FORMAT-01) */
  display?: MetricValueDisplay;
}

/**
 * 都道府県×テーマのページの説明文 (meta description・構造化データ) に入れる、その県の主な値。
 * 画面の指標カードと同じく、テーマの指標の並び (tabIndicators) の順にテーマの短い名前で返す
 * (2026-10-30。旧: 配信データの並びの先頭から正式名で取り、画面のタイルと名前も順番も違った)。
 */
export function getAreaThemeHighlights(
  data: AreaThemeHighlightSource,
  areaCode: string,
  indicators: ReadonlyArray<{ rankingKey: string; tabLabel: string }>,
  limit = 3,
): AreaThemeHighlight[] {
  const highlights: AreaThemeHighlight[] = [];
  for (const { rankingKey: key, tabLabel } of indicators) {
    const indicator = data.indicatorDataMap[key];
    if (!indicator) continue;
    const target = indicator.rankingValues.find(
      (value) => value.areaCode === areaCode && Number.isFinite(value.value),
    );
    if (target?.value === null || target?.value === undefined) continue;
    const unit = target.unit || indicator.rankingItem.unit;
    // 指標カードと同じく、同じ年の 47 都道府県の値 (全国の行を除く) から書き方を決める
    const sameYearValues = indicator.rankingValues.flatMap((value) =>
      value.yearName === target.yearName &&
      !isNationalAreaCode(value.areaCode) &&
      typeof value.value === 'number' &&
      Number.isFinite(value.value)
        ? [value.value]
        : [],
    );
    highlights.push({
      key,
      title: tabLabel,
      value: target.value,
      unit,
      yearName: target.yearName,
      rank: typeof target.rank === 'number' ? target.rank : null,
      display: resolveMetricValueDisplay({ unit, valueDisplay: indicator.rankingItem.valueDisplay }, sameYearValues),
    });
    if (highlights.length >= limit) break;
  }
  return highlights;
}

/**
 * 都道府県×テーマのページの説明文 (meta description)。その県の主な値と順位を先頭に置く (2026-10-30。
 * 旧: 「{県}における{テーマの説明}。全国47都道府県との比較で…」の定型で、どの県も数字が無かった)。
 * 値が無い県はテーマの説明だけにする。長さは検索結果で切れにくい 120 字前後を目安に、値は 2 件まで。
 */
export function areaThemeDescription(
  areaName: string,
  themeDescription: string,
  highlights: readonly AreaThemeHighlight[],
): string {
  const facts = highlights.slice(0, 2).map((highlight) => {
    const rank = highlight.rank !== null ? `・全国${highlight.rank}位` : '';
    const display = highlight.display;
    const value = formatMetricValue(highlight.value, display?.precision, display?.displayScale);
    const unit = display ? metricDisplayUnit({ unit: highlight.unit, displayScale: display.displayScale }) : formatUnitForDisplay(highlight.unit);
    return `${highlight.title}は${value}${unit}（${highlight.yearName}${rank}）`;
  });
  const lead = facts.length > 0 ? `${areaName}の${facts.join('、')}。` : '';
  return `${lead}${areaName}における${themeDescription}全国47都道府県との比較で${areaName}の位置づけを確認できます。`;
}
