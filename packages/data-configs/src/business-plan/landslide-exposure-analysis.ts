import type { BusinessPlanM1Analysis } from './types';
import { LANDSLIDE_EXPOSURE_SOURCE as S } from '../theme-catalog/landslide-exposure-source';
/** Site analysis only; the M1 campaign and SNS catalogs do not change. */
export const LANDSLIDE_EXPOSURE_ANALYSIS = {
  id: 'm1-analysis-population-landslide-exposure',
  contentId: 'geo-107',
  slug: S.slug,
  title: '土砂災害の指定区域と人口・公共施設',
  question:
    '指定済み区域面に中心がある250mメッシュ人口と公共施設地点はどのくらいか',
  analysisKind: 'spatial-cross',
  sourceLayers: [
    {
      id: 'ksj-population-mesh-250m',
      label: '250mメッシュの2020年基準人口',
      geometry: 'mesh',
      role: 'calculation-input',
      usedInCalculation: true,
    },
    {
      id: 'ksj-p05-public-facility-point',
      label: '2022年の市町村役場等・公的集会施設',
      geometry: 'point',
      role: 'calculation-input',
      usedInCalculation: true,
    },
    {
      id: 'ksj-a33-landslide-polygons',
      label: 'A33-25指定済み区域面（京都府除外）',
      geometry: 'polygon',
      role: 'calculation-input',
      usedInCalculation: true,
    },
  ],
  spatialOperations: [
    '警戒・特別警戒×3現象の面の和集合と全国の点包含、原典県コードへ集計',
    '人口・施設群の排他的3区分と格子感度を検算。京都府は全曝露値null、総計は対象46県。',
  ],
  primaryMetricKey: 'exposedCenterPopulationShare',
  metricKeys: [
    'exposedCenterPopulation',
    'warningCenterPopulation',
    'specialCenterPopulation',
    'exposedCenterPopulationShare',
    'population2020',
    'exposedAdministrativeFacilities',
    'administrativeFacilities',
    'exposedMeetingFacilities',
    'meetingFacilities',
  ],
  r2Key: `${S.r2Root}/item.json`,
  evidenceManifestKey: `${S.r2Root}/manifest.json`,
  detailR2KeyPattern: `${S.r2Root}/pref/{NN}.json`,
  status: 'ready',
  geography: 'prefecture',
  comparisonLimit: 3,
  expectedObservationCount: 47,
  dataVersion: S.dataVersion,
  evidenceCheckedAt: '2026-09-11',
  sourceName: `${S.a33.title}・${S.population.title}・${S.facilities.title}`,
  sourceUrl: S.a33.pageUrl,
  caveats: S.notes,
} as const satisfies BusinessPlanM1Analysis;
