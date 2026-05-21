/** 都道府県間 人口移動フロー: 型定義 */

/** 1 つの相手県との移動実績 (焦点県視点) */
export interface MigrationPartner {
  /** 2 桁県コード */
  code: string;
  name: string;
  /** 相手県 → 焦点県 の年間移動者数 */
  inflow: number;
  /** 焦点県 → 相手県 の年間移動者数 */
  outflow: number;
  /** inflow - outflow (正 = 焦点県が獲得) */
  net: number;
}

/** public/migration-flow/{NN}.json の構造 */
export interface MigrationFlowData {
  focusCode: string;
  focusName: string;
  year: number;
  source: string;
  partners: MigrationPartner[];
  totals: { inflow: number; outflow: number; net: number };
}

/** 市区町村の純移動（焦点県を市区町村粒度で描くため） */
export interface MunicipalityNet {
  /** 5 桁市区町村コード */
  code: string;
  name: string;
  inflow: number;
  outflow: number;
  /** 転入超過数 (正 = 転入超過) */
  net: number;
}

/** public/migration-flow/municipalities/{NN}.json の構造 */
export interface MunicipalityData {
  prefCode: string;
  year: number;
  municipalities: MunicipalityNet[];
}

/** 投影済み都道府県シェイプ */
export interface PrefShape {
  code: string;
  name: string;
  /** SVG path 文字列 */
  path: string;
  /** 投影後の重心 [x, y] */
  centroid: [number, number];
  /** 塗り色 */
  fill: string;
  /** 焦点県中心ズームのフレーム内に重心が収まるか */
  near: boolean;
  /** 投影後の面積 (px^2)。ラベル表示の優先度に使う */
  area: number;
}
