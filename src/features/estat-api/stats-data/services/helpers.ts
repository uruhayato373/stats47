import { FormattedValue } from "@/features/estat-api/core/types/stats-data";

/**
 * 地域コードでフィルタ
 *
 * @param values - データ値配列
 * @param areaCodes - 地域コード（単一または配列）
 * @returns フィルタされたデータ値配列
 *
 * @example
 * ```typescript
 * const tokyoData = filterByArea(values, "13000");
 * const kantoData = filterByArea(values, ["13000", "14000", "11000"]);
 * ```
 */
export function filterByArea(
  values: FormattedValue[],
  areaCodes: string | string[]
): FormattedValue[] {
  const codes = Array.isArray(areaCodes) ? areaCodes : [areaCodes];
  return values.filter((v) => codes.includes(v.dimensions.area.code));
}

/**
 * 年度でフィルタ
 *
 * @param values - データ値配列
 * @param timeCodes - 年度コード（単一または配列）
 * @returns フィルタされたデータ値配列
 *
 * @example
 * ```typescript
 * const data2020 = filterByTime(values, "2020");
 * const recentData = filterByTime(values, ["2020", "2021", "2022"]);
 * ```
 */
export function filterByTime(
  values: FormattedValue[],
  timeCodes: string | string[]
): FormattedValue[] {
  const codes = Array.isArray(timeCodes) ? timeCodes : [timeCodes];
  return values.filter((v) => codes.includes(v.dimensions.time.code));
}

/**
 * カテゴリでフィルタ（任意の次元）
 *
 * @param values - データ値配列
 * @param dimension - 次元名
 * @param codes - コード（単一または配列）
 * @returns フィルタされたデータ値配列
 *
 * @example
 * ```typescript
 * const maleData = filterByDimension(values, "cat01", "001");
 * const specificCategories = filterByDimension(values, "cat02", ["A", "B"]);
 * ```
 */
export function filterByDimension(
  values: FormattedValue[],
  dimension: keyof FormattedValue["dimensions"],
  codes: string | string[]
): FormattedValue[] {
  const codeList = Array.isArray(codes) ? codes : [codes];
  return values.filter((v) => {
    const dim = v.dimensions[dimension];
    return dim && codeList.includes(dim.code);
  });
}

/**
 * 都道府県のみ抽出（level="2"）
 *
 * @param values - データ値配列
 * @returns 都道府県データのみ
 *
 * @example
 * ```typescript
 * const prefectureData = getPrefectures(values);
 * ```
 */
export function getPrefectures(values: FormattedValue[]): FormattedValue[] {
  return values.filter(
    (v) => v.dimensions.area.level === "2" && v.dimensions.area.code !== "00000"
  );
}

/**
 * 有効な数値データのみ抽出
 *
 * @param values - データ値配列
 * @returns 有効な数値を持つデータのみ
 *
 * @example
 * ```typescript
 * const validData = getValidValues(values);
 * ```
 */
export function getValidValues(values: FormattedValue[]): FormattedValue[] {
  return values.filter((v) => v.value !== null);
}

/**
 * 特殊文字データのみ抽出
 *
 * @param values - データ値配列
 * @returns 特殊文字（null値）を持つデータのみ
 *
 * @example
 * ```typescript
 * const specialData = getSpecialValues(values);
 * ```
 */
export function getSpecialValues(values: FormattedValue[]): FormattedValue[] {
  return values.filter((v) => v.value === null);
}

/**
 * 特定の地域レベルのデータを抽出
 *
 * @param values - データ値配列
 * @param level - 地域レベル（"1": 全国, "2": 都道府県, "3": 市区町村）
 * @returns 指定レベルのデータのみ
 *
 * @example
 * ```typescript
 * const nationalData = getByAreaLevel(values, "1");
 * const prefectureData = getByAreaLevel(values, "2");
 * ```
 */
export function getByAreaLevel(
  values: FormattedValue[],
  level: "1" | "2" | "3"
): FormattedValue[] {
  return values.filter((v) => v.dimensions.area.level === level);
}

/**
 * データを地域コードでグループ化
 *
 * @param values - データ値配列
 * @returns 地域コードをキーとしたMap
 *
 * @example
 * ```typescript
 * const grouped = groupByArea(values);
 * const tokyoData = grouped.get("13000");
 * ```
 */
export function groupByArea(
  values: FormattedValue[]
): Map<string, FormattedValue[]> {
  const grouped = new Map<string, FormattedValue[]>();

  values.forEach((value) => {
    const areaCode = value.dimensions.area.code;
    if (!grouped.has(areaCode)) {
      grouped.set(areaCode, []);
    }
    grouped.get(areaCode)!.push(value);
  });

  return grouped;
}

/**
 * データを年度でグループ化
 *
 * @param values - データ値配列
 * @returns 年度コードをキーとしたMap
 *
 * @example
 * ```typescript
 * const grouped = groupByTime(values);
 * const data2020 = grouped.get("2020");
 * ```
 */
export function groupByTime(
  values: FormattedValue[]
): Map<string, FormattedValue[]> {
  const grouped = new Map<string, FormattedValue[]>();

  values.forEach((value) => {
    const timeCode = value.dimensions.time.code;
    if (!grouped.has(timeCode)) {
      grouped.set(timeCode, []);
    }
    grouped.get(timeCode)!.push(value);
  });

  return grouped;
}

/**
 * データをカテゴリでグループ化（任意の次元）
 *
 * @param values - データ値配列
 * @param dimension - 次元名
 * @returns カテゴリコードをキーとしたMap
 *
 * @example
 * ```typescript
 * const grouped = groupByDimension(values, "cat01");
 * const maleData = grouped.get("001");
 * ```
 */
export function groupByDimension(
  values: FormattedValue[],
  dimension: keyof FormattedValue["dimensions"]
): Map<string, FormattedValue[]> {
  const grouped = new Map<string, FormattedValue[]>();

  values.forEach((value) => {
    const dim = value.dimensions[dimension];
    if (!dim) return;

    const code = dim.code;
    if (!grouped.has(code)) {
      grouped.set(code, []);
    }
    grouped.get(code)!.push(value);
  });

  return grouped;
}

/**
 * 統計値を降順でソート
 *
 * @param values - データ値配列
 * @returns 降順ソートされたデータ配列
 *
 * @example
 * ```typescript
 * const sorted = sortByValueDesc(values);
 * ```
 */
export function sortByValueDesc(values: FormattedValue[]): FormattedValue[] {
  return [...values].sort((a, b) => {
    // null値は最後に
    if (a.value === null && b.value === null) return 0;
    if (a.value === null) return 1;
    if (b.value === null) return -1;

    return b.value - a.value;
  });
}

/**
 * 統計値を昇順でソート
 *
 * @param values - データ値配列
 * @returns 昇順ソートされたデータ配列
 *
 * @example
 * ```typescript
 * const sorted = sortByValueAsc(values);
 * ```
 */
export function sortByValueAsc(values: FormattedValue[]): FormattedValue[] {
  return [...values].sort((a, b) => {
    // null値は最後に
    if (a.value === null && b.value === null) return 0;
    if (a.value === null) return 1;
    if (b.value === null) return -1;

    return a.value - b.value;
  });
}
