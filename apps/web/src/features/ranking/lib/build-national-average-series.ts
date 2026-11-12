import { PREFECTURE_AREA_CODE_RE, PREFECTURE_CODE_2DIGIT_RE } from "@stats47/area";
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
  /** 有効な都道府県値の数 */
  count: number;
  /** 公表の全国行を含めない都道府県の単純平均 */
  mean?: number | null;
  /** 台帳で許可され、重複なく47県がそろう年だけの合計 */
  total?: number | null;
  /** 公表値 (全国計 / 全国値) か単純平均か */
  kind: NationalFigureKind;
}

/**
 * 全年の ranking values から全国の基準値の時系列を組み立てる。
 *
 * 各年を resolveNationalFigure に通し、公表の全国値 (00000) があればそれ、
 * 無ければ都道府県の単純平均を使う。公表値の年が 1 つでもあれば公表値の年だけを
 * 残す — 単純平均と全国値は別の量なので、1 本の線につなぐと偽の段差が出る。
 * 合計表示が許可される場合は、別途算出した平均・合計の系列として全ての年を残す。
 */
export function buildNationalAverageSeries(
  allYears: RankingValue[],
  { showTotal = false }: { showTotal?: boolean } = {},
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
    const prefectures = b.rows.filter((row): row is RankingValue & { value: number } =>
      (PREFECTURE_AREA_CODE_RE.test(row.areaCode) || PREFECTURE_CODE_2DIGIT_RE.test(row.areaCode)) &&
      typeof row.value === "number" && Number.isFinite(row.value),
    );
    const count = prefectures.length;
    const sum = prefectures.reduce((total, row) => total + row.value, 0);
    const hasAllPrefectures = count === PREFECTURE_COUNT &&
      new Set(prefectures.map((row) => row.areaCode.slice(0, 2))).size === PREFECTURE_COUNT;
    points.push({
      year,
      yearCode: b.yearCode,
      yearName: b.yearName,
      value: figure.value,
      count,
      mean: count > 0 ? sum / count : null,
      total: showTotal && hasAllPrefectures && Number.isFinite(sum) ? sum : null,
      kind: figure.kind,
    });
  }

  const hasOfficial = points.some((p) => p.kind !== "simple-mean");
  // 合計と単純平均を別々に描ける場合は、公表の全国行が無い年も同じ系列として使える。
  const hasTotals = points.some((p) => p.total != null);
  return points
    .filter((p) => hasTotals || !hasOfficial || p.kind !== "simple-mean")
    .sort((a, b) => a.year - b.year);
}
