/**
 * Area ドメインのR2パス定義
 * 統合バケット内でのディレクトリパスを定義
 */

export const AREA_R2_PATHS = {
  /** 都道府県データの保存パス */
  PREFECTURES: "area/prefectures",

  /** 市区町村データの保存パス */
  MUNICIPALITIES: "area/municipalities",
} as const;

/**
 * R2パスの完全なキーを生成
 */
export function buildAreaR2Key(
  type: keyof typeof AREA_R2_PATHS,
  ...pathSegments: (string | number)[]
): string {
  const basePath = AREA_R2_PATHS[type];
  return `${basePath}/${pathSegments.join("/")}`;
}

/**
 * 都道府県データのR2キーを生成
 * @param prefCode - 都道府県コード
 * @returns R2キー (例: 'area/prefectures/01.json')
 */
export function buildPrefectureKey(prefCode: string): string {
  return buildAreaR2Key("PREFECTURES", `${prefCode}.json`);
}

/**
 * 市区町村データのR2キーを生成
 * @param cityCode - 市区町村コード
 * @returns R2キー (例: 'area/municipalities/01001.json')
 */
export function buildMunicipalityKey(cityCode: string): string {
  return buildAreaR2Key("MUNICIPALITIES", `${cityCode}.json`);
}
