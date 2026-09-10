import type { GeoAnalysisSnapshot } from './snapshot';
import { SNOW_DESIGNATION_SOURCE as SOURCE } from '../../../data-configs/src/theme-catalog/snow-designation-source';

export const SNOW_DESIGNATION_DEFINITION = {
  schemaVersion: 1,
  slug: SOURCE.slug,
  dataVersion: SOURCE.dataVersion,
  geography: 'prefecture',
  title: '2016年度の豪雪指定区域と2020年人口',
  question:
    '豪雪指定区域に中心がある250mメッシュの人口と指定区域の面積はどのくらいか',
  primaryMetricKey: 'designatedCenterPopulationShare',
  metrics: [
    {
      key: 'designatedCenterPopulation',
      label: '指定区域に中心があるメッシュ人口',
      unit: '人',
      format: 'integer',
      description:
        '豪雪地帯と特別豪雪地帯の和集合に中心がある250mメッシュの2020年基準人口。',
    },
    {
      key: 'specialCenterPopulation',
      label: 'うち特別豪雪地帯のメッシュ人口',
      unit: '人',
      format: 'integer',
      description: '特別豪雪地帯に中心があるメッシュ人口。指定区域人口の内数。',
    },
    {
      key: 'designatedCenterPopulationShare',
      label: '指定区域に中心があるメッシュ人口割合',
      unit: '%',
      format: 'percent1',
      description:
        '分母は同じ原典・同じ県の2020年基準人口総数。現在の法指定人口割合ではない。',
    },
    {
      key: 'designatedAreaKm2',
      label: '指定区域のGIS算出面積',
      unit: 'km²',
      format: 'decimal1',
      description:
        'A22-16指定ポリゴンの和集合をGRS80楕円体上で測定。特別豪雪地帯を含む。',
    },
    {
      key: 'specialAreaKm2',
      label: 'うち特別豪雪地帯のGIS算出面積',
      unit: 'km²',
      format: 'decimal1',
      description: '指定区域のGIS算出面積の内数。',
    },
    {
      key: 'boundaryCellPopulation',
      label: '指定境界を横切るメッシュ人口',
      unit: '人',
      format: 'integer',
      description:
        '指定区域と交差するが格子全体が区域内には入らない250mメッシュの人口。',
    },
    {
      key: 'population2020',
      label: '2020年基準人口',
      unit: '人',
      format: 'integer',
      description: 'KSJ m250r6-24のPTN_2020。同県全メッシュの合計。',
    },
  ],
  method: [
    'A22-16の全24県とm250r6-24の全47県の公式ZIPをSHA256・bytesで固定。人口0の行も入力件数と保存則へ含める。',
    'MESH_IDから250mの正規格子を復元し、県とSHICODEを保持して同県の指定区域へ中心包含。境界上は包含、特別豪雪を優先する。',
    '重複する指定ポリゴンを和集合にし、特別豪雪・通常豪雪・中心が区域外の3区分を排他的に割り当てる。',
    '人口は原典小数4桁を整数化して合計。面積按分は行わない。47県の途中artifactと全国の件数・人口・面積を検算。',
    '指定区域の面積はGRS80楕円体面積。EPSG:6933の等積投影で独立検算。地図の20m簡略化は計算後だけ。',
  ],
  sources: [
    {
      name: SOURCE.snow.title,
      url: SOURCE.snow.pageUrl,
      datasetId: SOURCE.snow.datasetId,
      version: SOURCE.snow.version,
      license: SOURCE.snow.license,
    },
    {
      name: SOURCE.population.title,
      url: SOURCE.population.pageUrl,
      datasetId: SOURCE.population.datasetId,
      version: SOURCE.population.version,
      license: SOURCE.population.license,
    },
  ],
  caveats: SOURCE.notes,
} as const satisfies Omit<
  GeoAnalysisSnapshot,
  'generatedAt' | 'rows' | 'summary' | 'dataQuality'
>;

/** JSON.stringify(definition) SHA256; update together with the authored definition. */
export const SNOW_DESIGNATION_DEFINITION_SHA256 =
  'ee7b56090c059c027361bc5ec74c39ea62e18b8af6f3486f04dbd3071092c91f';
