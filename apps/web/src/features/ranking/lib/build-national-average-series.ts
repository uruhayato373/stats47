import type { RankingValue } from "@stats47/ranking";

/** 全国平均系列の 1 点 (1 年分) */
export interface NationalAveragePoint {
  /** 4 桁年 (MiniLineChart の ChartPoint が number を要求するため) */
  year: number;
  yearCode: string;
  yearName: string;
  /** その年の都道府県平均 */
  value: number;
  /** 平均の母数になった都道府県数 (47 未満の年は変化率の算出から外す) */
  count: number;
}

/** 都道府県の総数 (変化率を出してよいか判定する母数) */
const PREFECTURE_COUNT = 47;

/** 全国行。R2 の ranking values には無いはずだが防御的に除外する */
const NATIONAL_AREA_CODE = "00000";

/**
 * 全年の ranking values から「全国平均」の時系列を組み立てる。
 *
 * R2 の ranking values (`app/ranking/<key>/values.json`) には全国行 (00000) が
 * 無いため、各年の都道府県平均を全国系列として使う。
 * theme-dashboard の buildNationalSeries と同じ根拠だが、こちらは変化率の
 * 判定に使う count と、ラベル表示に使う yearCode / yearName を保持する。
 */
export function buildNationalAverageSeries(
  allYears: RankingValue[],
): NationalAveragePoint[] {
  const byYear = new Map<
    number,
    { yearCode: string; yearName: string; sum: number; count: number }
  >();

  for (const row of allYears) {
    if (row.areaCode === NATIONAL_AREA_CODE) continue;
    if (typeof row.value !== "number" || !Number.isFinite(row.value)) continue;

    const year = Number(String(row.yearCode).slice(0, 4));
    if (!Number.isFinite(year)) continue;

    const bucket = byYear.get(year);
    if (bucket) {
      bucket.sum += row.value;
      bucket.count += 1;
    } else {
      byYear.set(year, {
        yearCode: row.yearCode,
        yearName: row.yearName,
        sum: row.value,
        count: 1,
      });
    }
  }

  return [...byYear.entries()]
    .map(([year, b]) => ({
      year,
      yearCode: b.yearCode,
      yearName: b.yearName,
      value: b.sum / b.count,
      count: b.count,
    }))
    .sort((a, b) => a.year - b.year);
}

/** 期間変化。始点年は指標ごとに違うため固定窓 (「10年変化」) は作らない */
export interface NationalAveragePeriodChange {
  fromYear: number;
  toYear: number;
  /** 符号付きの表示文字列 (例: "+8.4%" / "-2.3pt") */
  text: string;
}

/**
 * 系列の実測両端から期間変化を求める。
 *
 * 「10年変化」のような固定窓は使わない。指標ごとに開始年が違い、存在しない
 * 基準年を暗黙に作ってしまうため (.claude/rules/evidence-based-judgment.md)。
 * 母数が 47 に満たない年を端点に含む場合は、平均どうしが比較できないので null を返す。
 */
export function computeNationalAveragePeriodChange(
  series: NationalAveragePoint[],
  unit: string,
): NationalAveragePeriodChange | null {
  if (series.length < 2) return null;

  const first = series[0];
  const last = series[series.length - 1];
  if (first.count !== PREFECTURE_COUNT || last.count !== PREFECTURE_COUNT) {
    return null;
  }

  // 単位が % の指標は「率の率変化」が誤読を招くのでポイント差で出す
  if (unit.trim() === "%") {
    const diff = last.value - first.value;
    return {
      fromYear: first.year,
      toYear: last.year,
      text: `${formatSigned(diff)}pt`,
    };
  }

  if (first.value <= 0) return null;
  const rate = ((last.value - first.value) / first.value) * 100;
  return {
    fromYear: first.year,
    toYear: last.year,
    text: `${formatSigned(rate)}%`,
  };
}

function formatSigned(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "±";
  return `${sign}${Math.abs(rounded).toLocaleString("ja-JP", {
    maximumFractionDigits: 1,
  })}`;
}
