/**
 * ランキングページの「全国の基準値」を 1 か所で決める (オーナー判断 2026-09-27)。
 *
 * - 公表の全国値 (areaCode 00000) があればそれを使う。
 *   - 47 都道府県の合計と一致する場合は総数なので「全国計」と呼び、平均として扱わない
 *   - 一致しない場合 (率・1 人あたり等) は「全国値」
 * - 全国値が無ければ都道府県の単純平均を使い「47都道府県の単純平均」と明記する
 *
 * ヘッダー・推移・FAQ JSON-LD・meta description が同じ関数を通るので、
 * 画面ごとにラベルが食い違わない。
 *
 * 2026-09-27 実測: sitemap の ranking 2,408 件から 201 件抽出し R2 の
 * app/ranking/<key>/values.json と app/stats/<key>/values.json を確認したところ、
 * 00000 行を持つものは 0 件だった。現状は全ページが単純平均の分岐になる。
 */

/** 全国の基準値の種類 */
export type NationalFigureKind = "national-total" | "national-value" | "simple-mean";

export interface NationalFigure {
  value: number;
  kind: NationalFigureKind;
  /** 表示ラベル (全国計 / 全国値 / 47都道府県の単純平均) */
  label: string;
  /** 単純平均の母数。公表値のときは null */
  prefectureCount: number | null;
}

interface AreaValue {
  areaCode: string;
  value: number | null;
}

/** 都道府県の総数 */
export const PREFECTURE_COUNT = 47;

/** 合計と全国値の一致を判定する相対許容幅 (推計の丸め・非公表県の差を吸収) */
const TOTAL_MATCH_TOLERANCE = 0.005;

/** 全国行か (5 桁 00000 と 2 桁正規化後の 00) */
export function isNationalAreaCode(code: string): boolean {
  return code === "00000" || code === "00";
}

/** 都道府県行か (2 桁 01-47 または XX000) */
function isPrefectureAreaCode(code: string): boolean {
  if (/^\d{2}$/.test(code)) return code !== "00";
  if (/^\d{2}000$/.test(code)) return code !== "00000";
  return false;
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** 単純平均のラベル。母数が 47 未満なら実数を書く */
export function simpleMeanLabel(count: number): string {
  return `${count}都道府県の単純平均`;
}

/**
 * 公表の全国値が 47 都道府県の合計と一致するか (= 総数指標か)。
 * 47 県がそろわない年は合計と比べられないので false (全国値扱い)。
 */
function isNationalTotal(national: number, prefValues: number[]): boolean {
  if (prefValues.length !== PREFECTURE_COUNT) return false;
  const sum = prefValues.reduce((a, b) => a + b, 0);
  if (sum === 0) return national === 0;
  return Math.abs(national - sum) / Math.abs(sum) <= TOTAL_MATCH_TOLERANCE;
}

/**
 * 1 年分の values から全国の基準値を求める。都道府県値も全国値も無ければ null。
 */
export function resolveNationalFigure(values: AreaValue[]): NationalFigure | null {
  const prefValues: number[] = [];
  let national: number | null = null;
  for (const row of values) {
    if (!isFiniteNumber(row.value)) continue;
    if (isNationalAreaCode(row.areaCode)) national = row.value;
    else if (isPrefectureAreaCode(row.areaCode)) prefValues.push(row.value);
  }

  if (national !== null) {
    const kind: NationalFigureKind = isNationalTotal(national, prefValues)
      ? "national-total"
      : "national-value";
    return {
      value: national,
      kind,
      label: kind === "national-total" ? "全国計" : "全国値",
      prefectureCount: null,
    };
  }

  if (prefValues.length === 0) return null;
  const mean = prefValues.reduce((a, b) => a + b, 0) / prefValues.length;
  return {
    value: mean,
    kind: "simple-mean",
    label: simpleMeanLabel(prefValues.length),
    prefectureCount: prefValues.length,
  };
}
