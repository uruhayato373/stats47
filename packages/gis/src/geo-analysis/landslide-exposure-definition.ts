import type { GeoAnalysisSnapshot } from './snapshot';
import { LANDSLIDE_EXPOSURE_SOURCE as S } from '../../../data-configs/src/theme-catalog/landslide-exposure-source';
export const LANDSLIDE_EXPOSURE_DEFINITION = {
  schemaVersion: 1,
  slug: S.slug,
  dataVersion: S.dataVersion,
  geography: 'prefecture',
  title: '土砂災害の指定区域と人口・公共施設',
  question:
    '指定済み区域面に中心がある250mメッシュ人口と公共施設地点はどのくらいか',
  primaryMetricKey: 'exposedCenterPopulationShare',
  metrics: [
    {
      key: 'exposedCenterPopulation',
      label: '指定区域面に中心があるメッシュ人口',
      unit: '人',
      format: 'integer',
      description: '警戒・特別警戒の指定済み面の和集合。2020年基準人口。',
    },
    {
      key: 'warningCenterPopulation',
      label: '警戒区域面に中心があるメッシュ人口',
      unit: '人',
      format: 'integer',
      description: '区域コード1の3現象の和集合。',
    },
    {
      key: 'specialCenterPopulation',
      label: '特別警戒区域面に中心があるメッシュ人口',
      unit: '人',
      format: 'integer',
      description: '区域コード2の面の3現象の和集合。警戒の内数とは仮定しない。',
    },
    {
      key: 'exposedCenterPopulationShare',
      label: '指定区域面に中心があるメッシュ人口割合',
      unit: '%',
      format: 'percent1',
      description: '同じ県・同じ原典の2020年基準人口を分母にする。',
    },
    {
      key: 'population2020',
      label: '2020年基準人口',
      unit: '人',
      format: 'integer',
      description: 'm250r6-24 PTN_2020、原典の市区町村コードによる所属。',
    },
    {
      key: 'exposedAdministrativeFacilities',
      label: '区域面内の市町村役場等',
      unit: '施設',
      format: 'integer',
      description: 'P05-22分類1〜3。原典地点の包含。',
    },
    {
      key: 'administrativeFacilities',
      label: '市町村役場等の対象施設総数',
      unit: '施設',
      format: 'integer',
      description: 'P05-22分類1〜3。',
    },
    {
      key: 'exposedMeetingFacilities',
      label: '区域面内の公的集会施設',
      unit: '施設',
      format: 'integer',
      description: 'P05-22分類4〜5。原典地点の包含。',
    },
    {
      key: 'meetingFacilities',
      label: '公的集会施設の対象施設総数',
      unit: '施設',
      format: 'integer',
      description: 'P05-22分類4〜5。',
    },
  ],
  method: [
    '46県のA33-25指定済み面を6種類の和集合にし、全国の250mメッシュ中心とP05施設地点を包含判定。',
    '県帰属は原典コードを保持。京都府の曝露行はnull。対象46県の人口と施設群はそれぞれ排他的3区分の保存則を検証。',
    '人口小数4桁を整数化して集計し、原典・県別途中artifact・区域種別mask・集計を同じmanifestで接続。',
  ],
  sources: [S.a33, S.population, S.facilities].map((s) => ({
    name: s.title,
    url: s.pageUrl,
    datasetId: s.datasetId,
    version: s.version,
    license:
      s.datasetId === 'A33'
        ? '版・県を限定した公開条件確認（京都府除外）'
        : '国土数値情報の当該公開版、原典と加工を表示',
  })),
  caveats: S.notes,
} as const satisfies Omit<
  GeoAnalysisSnapshot,
  'generatedAt' | 'rows' | 'summary' | 'dataQuality'
>;
export const LANDSLIDE_EXPOSURE_DEFINITION_SHA256 =
  '803f1d0c202dd4824dbc68c43c01ee0c8a2bdb529fb69e01427095d2493859a4';
