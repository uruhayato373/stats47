// データセット一覧とライセンス方針だけの公開口 (`@stats47/gis/mlit-ksj/catalog`)。
// `./index` は原典のダウンロード・変換 (unzipper・shapefile・proj4・topojson) まで含むので、
// Web のページはこちらを読む。
export { GIS_DATASETS, GIS_DATASETS_BY_ID } from "./datasets";
export type { GisDatasetMeta, GisDatasetRankingConfig } from "./datasets";
export {
  assertKsjPublicStructuredOutputAllowed,
  getKsjLicensePolicy,
} from "./license-policy";
export type {
  KsjCommercialUsePolicy,
  KsjLicensePolicy,
  KsjSourcePublicationPolicy,
} from "./license-policy";
