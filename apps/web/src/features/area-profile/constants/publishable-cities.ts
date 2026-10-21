import {
  buildMunicipalityEntityPolicy,
  listPublishableMunicipalities,
} from "@stats47/area";

/**
 * 市区町村ページを索引・sitemap・一覧の対象にする市区町村。
 *
 * 市区町村ランキングとデータブック (`databook.json`) を作る対象集合と同じもの
 * (市・町・村と東京 23 区。政令指定都市の行政区と「特別区部」の集約行は除く)。
 * 以前は手書きの 364 市 (PHASE_1_SSG_CITIES) だけを索引対象にしていた。残りのページは中身が薄かったためだが、
 * 2026-10-21 にどの市区町村も約 170 指標のデータブックを持つようになったので、この集合へ揃えた。
 */
export const PUBLISHABLE_CITIES = listPublishableMunicipalities(
  buildMunicipalityEntityPolicy(),
);

const PUBLISHABLE_CITY_PATHS = new Set(
  PUBLISHABLE_CITIES.map((city) => `${city.prefectureCode}:${city.code}`),
);

export function isPublishableCity(areaCode: string, cityCode: string): boolean {
  return PUBLISHABLE_CITY_PATHS.has(`${areaCode}:${cityCode}`);
}

export function listPublishableCitiesInPrefecture(areaCode: string) {
  return PUBLISHABLE_CITIES.filter((city) => city.prefectureCode === areaCode);
}
