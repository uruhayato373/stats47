import { DynamicField, FormData } from "../types";

/**
 * フォームデータと動的フィールドからURLパラメータを構築
 * @param formData - 基本フォームデータ
 * @param dynamicFields - 動的フィールド配列
 * @returns 構築されたURLSearchParams
 */
export function buildStatsDataUrlParams(
  formData: FormData,
  dynamicFields: DynamicField[]
): URLSearchParams {
  const urlParams = new URLSearchParams();

  urlParams.set("statsDataId", formData.statsDataId);
  if (formData.cdCat01) urlParams.set("cdCat01", formData.cdCat01);

  // 動的フィールドの値を追加
  dynamicFields.forEach((field) => {
    if (field.value) {
      urlParams.set(field.id, field.value);
    }
  });

  return urlParams;
}

/**
 * stats-dataページへの完全なURLを構築
 * @param formData - 基本フォームデータ
 * @param dynamicFields - 動的フィールド配列
 * @returns 完全なURL文字列
 */
export function buildStatsDataUrl(
  formData: FormData,
  dynamicFields: DynamicField[]
): string {
  const urlParams = buildStatsDataUrlParams(formData, dynamicFields);
  return `/admin/dev-tools/estat-api/stats-data?${urlParams.toString()}`;
}
