
import { FormattedValue } from "../types";
import { extractYearCode } from "../utils/extract-year-code";
import { extractYearName } from "../utils/generate-year-name"; // generate-year-name.tsからextractYearNameをインポート

import type { StatsSchema } from "@stats47/types";

/**
 * FormattedValueをStatsSchemaに変換
 *
 * cat01を主カテゴリとして使用。cat02以降はAPIクエリで
 * 単一値にフィルタされている前提で許容する。
 *
 * @param formattedValue - 変換元のFormattedValue
 * @returns StatsSchemaまたはundefined（cat01が存在しない場合）
 */
export function convertToStatsSchema(
  formattedValue: FormattedValue
): StatsSchema | undefined {
  // 必須のdimensionが存在しない場合は変換不可
  const cat01 = formattedValue.dimensions.cat01;
  const time = formattedValue.dimensions.time;
  const area = formattedValue.dimensions.area;
  if (!cat01 || !cat01.code || !time || !area) {
    return undefined;
  }

  // cat02以降はAPIクエリで特定値にフィルタされている場合は許容する
  // （cdCat02, cdCat03等で絞り込み済み）

  // e-Stat APIの時間コードから年度コードと年度名を抽出
  const fullTimeCode = time.code;
  const yearCode = extractYearCode(fullTimeCode);
  const yearName = extractYearName(time.name);

  // categoryNameからcategoryCodeのプレフィックスを削除（例: A1101_総人口 → 総人口）
  let categoryName = cat01.name;
  const categoryCodePrefix = cat01.code + "_";
  if (categoryName.startsWith(categoryCodePrefix)) {
    categoryName = categoryName.substring(categoryCodePrefix.length);
  }

  const areaCode = area.code;

  return {
    areaCode,
    areaName: area.name,
    yearCode,
    yearName,
    categoryCode: cat01.code,
    categoryName: categoryName,
    value: formattedValue.value ?? 0, // nullの場合は0
    unit: formattedValue.unit || "",
  };
}
