/**
 * GIS ドメインのR2パス定義
 * 統合バケット内でのディレクトリパスを定義
 */

export const GIS_R2_PATHS = {
  /** GeoShapeデータの保存パス */
  GEOSHAPE: "gis/geoshape",

  /** 境界データの保存パス */
  BOUNDARIES: "gis/boundaries",
} as const;

/**
 * R2パスの完全なキーを生成
 */
export function buildGisR2Key(
  type: keyof typeof GIS_R2_PATHS,
  ...pathSegments: (string | number)[]
): string {
  const basePath = GIS_R2_PATHS[type];
  return `${basePath}/${pathSegments.join("/")}`;
}

/**
 * GeoShapeデータのR2キーを生成
 * @param areaCode - 地域コード
 * @param year - 年度
 * @returns R2キー (例: 'gis/geoshape/01000/2020.topojson')
 */
export function buildGeoShapeKey(areaCode: string, year: number): string {
  return buildGisR2Key("GEOSHAPE", areaCode, `${year}.topojson`);
}

/**
 * 境界データのR2キーを生成
 * @param areaCode - 地域コード
 * @returns R2キー (例: 'gis/boundaries/01000.json')
 */
export function buildBoundaryKey(areaCode: string): string {
  return buildGisR2Key("BOUNDARIES", `${areaCode}.json`);
}
