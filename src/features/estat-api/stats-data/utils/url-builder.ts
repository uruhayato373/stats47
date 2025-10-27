import { StatsDataFormValues } from "../schemas/stats-data-form.schema";

/**
 * フォームデータからURLパラメータを構築
 * @param values - フォームデータ
 * @returns 構築されたURLSearchParams
 */
export function buildStatsDataUrlParams(
  values: StatsDataFormValues
): URLSearchParams {
  const urlParams = new URLSearchParams();

  urlParams.set("statsDataId", values.statsDataId);
  if (values.cdCat01) urlParams.set("cdCat01", values.cdCat01);

  // 動的フィールドの値を追加
  const dynamicFields = [
    "cdTime",
    "cdArea",
    "cdCat02",
    "cdCat03",
    "cdCat04",
    "cdCat05",
    "cdCat06",
    "cdCat07",
    "cdCat08",
    "cdCat09",
    "cdCat10",
    "cdCat11",
    "cdCat12",
    "cdCat13",
    "cdCat14",
    "cdCat15",
  ] as const;

  dynamicFields.forEach((fieldId) => {
    const value = values[fieldId];
    if (value && value.trim() !== "") {
      urlParams.set(fieldId, value);
    }
  });

  return urlParams;
}

/**
 * stats-dataページへの完全なURLを構築
 * @param values - フォームデータ
 * @returns 完全なURL文字列
 */
export function buildStatsDataUrl(values: StatsDataFormValues): string {
  const urlParams = buildStatsDataUrlParams(values);
  return `/admin/dev-tools/estat-api/stats-data?${urlParams.toString()}`;
}
