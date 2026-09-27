import {
  PREFECTURE_COUNT,
  resolveNationalFigure,
  type NationalFigureKind,
  type RankingValue,
} from "@stats47/ranking";

/** 全国の基準値系列の 1 点 (1 年分) */
export interface NationalAveragePoint {
  /** 4 桁年 (MiniLineChart の ChartPoint が number を要求するため) */
  year: number;
  yearCode: string;
  yearName: string;
  /** その年の全国の基準値 (公表の全国値、無ければ都道府県の単純平均) */
  value: number;
  /** 単純平均の母数。公表値の年は 47 とみなす (変化率の算出から外さない) */
  count: number;
  /** 公表値 (全国計 / 全国値) か単純平均か */
  kind: NationalFigureKind;
}

/**
 * 全年の ranking values から全国の基準値の時系列を組み立てる。
 *
 * 各年を resolveNationalFigure に通し、公表の全国値 (00000) があればそれ、
 * 無ければ都道府県の単純平均を使う。公表値の年が 1 つでもあれば公表値の年だけを
 * 残す — 単純平均と全国値は別の量なので、1 本の線につなぐと偽の段差が出る。
 */
export function buildNationalAverageSeries(
  allYears: RankingValue[],
): NationalAveragePoint[] {
  const byYear = new Map<
    number,
    { yearCode: string; yearName: string; rows: RankingValue[] }
  >();

  for (const row of allYears) {
    const year = Number(String(row.yearCode).slice(0, 4));
    if (!Number.isFinite(year)) continue;
    const bucket = byYear.get(year);
    if (bucket) bucket.rows.push(row);
    else byYear.set(year, { yearCode: row.yearCode, yearName: row.yearName, rows: [row] });
  }

  const points: NationalAveragePoint[] = [];
  for (const [year, b] of byYear) {
    const figure = resolveNationalFigure(b.rows);
    if (!figure) continue;
    points.push({
      year,
      yearCode: b.yearCode,
      yearName: b.yearName,
      value: figure.value,
      count: figure.prefectureCount ?? PREFECTURE_COUNT,
      kind: figure.kind,
    });
  }

  const hasOfficial = points.some((p) => p.kind !== "simple-mean");
  return points
    .filter((p) => !hasOfficial || p.kind !== "simple-mean")
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
