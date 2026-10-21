/**
 * 市区町村ページのデータブック (`app/areas/<県>/cities/<市区町村>/databook.json`)。
 *
 * 市区町村ランキングの配信値 (`app/municipalities/ranking/<key>/values.json`) を市区町村ごとに束ねたもの。
 * 値・全国順位はランキングページと同じものをそのまま写し、県内順位だけをここで数える。
 * 節は市区町村テーマ (`MUNICIPALITY_THEME_CATALOGS`)、並びと見出しは `CITY_DATABOOK_LAYOUT` が決める。
 * 生成は `generate-city-databooks.ts` (デプロイ時に市区町村ランキングの直後)。生成時刻は持たない
 * (中身が同じなら同じバイト列になり、変わった市区町村だけが反映される)。
 */

/** 指標の性質 (`@stats47/data-configs` の display-semantics と同じ語彙)。特徴の選定は率の指標だけを使う。 */
export type CityDatabookMetricBasis = 'rate' | 'total' | 'unknown';

export interface CityDatabookMetric {
  rankingKey: string;
  /** 市区町村ランキングページと同じ表示名 (同名の指標は限定子付き)。 */
  label: string;
  value: number;
  unit: string;
  yearCode: string;
  yearName: string;
  /** 全国の市区町村の中の順位と、比べた市区町村の数 (ランキングページと同じ)。 */
  nationalRank: number;
  nationalCount: number;
  /** 同じ都道府県の市区町村の中の順位と数。同じ値は同じ順位。 */
  prefectureRank: number;
  prefectureCount: number;
  basis: CityDatabookMetricBasis;
}

export interface CityDatabookSection {
  /** 市区町村テーマの slug (`/municipalities/themes/<slug>`)。 */
  themeSlug: string;
  title: string;
  /** 先に出た節で載せた指標は重ねて載せない。 */
  metricKeys: string[];
}

export interface CityDatabookPopulationChange {
  value: number;
  yearCode: string;
  yearName: string;
}

export interface CityDatabookSnapshot {
  schemaVersion: 1;
  areaCode: string;
  /** 「香川県 坂出市」の形 (市区町村マスタの名前)。 */
  areaName: string;
  prefectureCode: string;
  /** 見出しの KPI の指標キー (値の無い指標は除く)。 */
  headlineKeys: string[];
  /** 人口の前回の値 (人口の推移を title・説明文に書くため)。前回の値が無ければ null。 */
  previousPopulation: CityDatabookPopulationChange | null;
  sections: CityDatabookSection[];
  metrics: Record<string, CityDatabookMetric>;
}

export function cityDatabookKeyPath(prefectureCode: string, cityCode: string): string {
  return `app/areas/${prefectureCode}/cities/${cityCode}/databook.json`;
}
