/**
 * GeoShapeデータ自動キャッシング設定
 *
 * R2ストレージ、外部URL、キャッシュTTL等の設定を管理
 */

export const GEOSHAPE_CONFIG = {
  // レベル1: 静的データ（ビルドに含める）
  static: {
    prefectures: "/data/geoshape/prefectures/jp_pref.topojson",
    metadata: "/data/geoshape/metadata/version.json",
  },

  // レベル2: R2ストレージ（CDN経由）
  r2: {
    baseUrl:
      process.env.NEXT_PUBLIC_R2_GEOSHAPE_URL || "https://geoshape.stats47.com",
    bucketName: "stats47-geoshape",
    municipalities: (prefCode: string) =>
      `municipalities/${prefCode}_city.topojson`,
    municipalitiesMerged: (prefCode: string) =>
      `municipalities-merged/${prefCode}_city_dc.topojson`,
  },

  // レベル3: 外部URL（フォールバック）
  fallback: {
    baseUrl: "https://geoshape.ex.nii.ac.jp/city/choropleth",
    municipalities: (prefCode: string) => `${prefCode}_city.topojson`,
    municipalitiesMerged: (prefCode: string) => `${prefCode}_city_dc.topojson`,
  },

  // キャッシュ設定
  cache: {
    browserTTL: 60 * 60 * 24 * 30, // 30日
    cdnTTL: 60 * 60 * 24 * 365, // 1年
    swrTTL: Infinity, // 永続
    retryAttempts: 3, // リトライ回数
    retryDelay: 1000, // リトライ遅延（ms）
    timeout: 10000, // タイムアウト（ms）
  },

  // データバージョン
  version: "2024.03.31",
} as const;

/**
 * 都道府県コードの検証
 */
export function validatePrefectureCode(code: string): boolean {
  const numCode = parseInt(code);
  return numCode >= 1 && numCode <= 47;
}

/**
 * 都道府県コードを正規化（2桁ゼロパディング）
 */
export function normalizePrefectureCode(code: string | number): string {
  return code.toString().padStart(2, "0");
}

/**
 * キャッシュキー生成
 */
export function generateCacheKey(
  level: "municipality" | "municipality_merged",
  prefectureCode: string
): string {
  return `${level}/${prefectureCode}`;
}

/**
 * R2ファイル名生成
 */
export function generateR2FileName(
  level: "municipality" | "municipality_merged",
  prefectureCode: string
): string {
  return level === "municipality"
    ? `municipalities/${prefectureCode}_city.topojson`
    : `municipalities-merged/${prefectureCode}_city_dc.topojson`;
}

/**
 * 外部URLファイル名生成
 */
export function generateExternalFileName(
  level: "municipality" | "municipality_merged",
  prefectureCode: string
): string {
  return level === "municipality"
    ? `${prefectureCode}_city.topojson`
    : `${prefectureCode}_city_dc.topojson`;
}
