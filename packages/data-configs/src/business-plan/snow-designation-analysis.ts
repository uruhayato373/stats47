import type { BusinessPlanM1Analysis } from './types';
import { SNOW_DESIGNATION_SOURCE as SOURCE } from '../theme-catalog/snow-designation-source';

/** Site Geo analysis only. Do not add this to the M1 publication campaign or create SNS products. */
export const SNOW_DESIGNATION_ANALYSIS = {
  id: 'm1-analysis-population-snow-designation',
  contentId: 'geo-096',
  slug: SOURCE.slug,
  title: '2016年度の豪雪指定区域と2020年人口',
  question:
    '豪雪指定区域に中心がある250mメッシュの人口と指定区域の面積はどのくらいか',
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
      id: 'ksj-a22-snow-designation',
      label: '2016年度の豪雪指定区域',
      geometry: 'polygon',
      role: 'calculation-input',
      usedInCalculation: true,
    },
  ],
  spatialOperations: [
    '同県の豪雪/特別豪雪区域の和集合と250mメッシュ中心包含',
    '人口3区分の整数保存、格子の完全包含/交差、GRS80面積と等積投影面積の検算',
  ],
  primaryMetricKey: 'designatedCenterPopulationShare',
  metricKeys: [
    'designatedCenterPopulation',
    'specialCenterPopulation',
    'designatedCenterPopulationShare',
    'designatedAreaKm2',
    'specialAreaKm2',
    'boundaryCellPopulation',
    'population2020',
  ],
  r2Key: `${SOURCE.r2Root}/item.json`,
  evidenceManifestKey: `${SOURCE.r2Root}/manifest.json`,
  detailR2KeyPattern: `${SOURCE.r2Root}/pref/{NN}.json`,
  status: 'ready',
  geography: 'prefecture',
  comparisonLimit: 3,
  expectedObservationCount: 47,
  dataVersion: SOURCE.dataVersion,
  evidenceCheckedAt: '2026-09-11',
  sourceName: `${SOURCE.snow.title}・${SOURCE.population.title}`,
  sourceUrl: SOURCE.snow.pageUrl,
  caveats: SOURCE.notes,
} as const satisfies BusinessPlanM1Analysis;
