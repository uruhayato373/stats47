import type { BusinessPlanM1Analysis } from './types';

/**
 * Site Geo analysis only. Do not add this to the M1 publication campaign or create SNS products.
 * 標高・傾斜度3次メッシュ(G04-a 2011年度版)と1kmメッシュ人口(mesh1000r6 2020年)を
 * 3次メッシュコードの完全一致で結合する。生成物の検証は packages/gis の low-elevation-population.ts。
 */
export const LOW_ELEVATION_POPULATION_ANALYSIS = {
  id: 'm1-analysis-population-low-elevation',
  contentId: 'geo-129',
  slug: 'population-low-elevation',
  title: '標高の低い土地に、どれだけの人が住んでいるか',
  question:
    '標高・傾斜度3次メッシュと1kmメッシュ人口(2020年)を重ねると、標高の低い土地に住む人口の割合は県でどう違うか',
  analysisKind: 'spatial-cross',
  sourceLayers: [
    {
      id: 'ipss-population-mesh-1km',
      label: '1kmメッシュの2020年人口',
      geometry: 'mesh',
      role: 'calculation-input',
      usedInCalculation: true,
    },
    {
      id: 'ksj-g04a-elevation-mesh-3rd',
      label: '標高・傾斜度3次メッシュ(平均・最高・最低標高)',
      geometry: 'mesh',
      role: 'calculation-input',
      usedInCalculation: true,
    },
  ],
  spatialOperations: [
    '人口と標高を同じ3次メッシュコードで完全一致結合し、両側の境界がコードの区画と一致することを全メッシュで検査',
    '平均標高で0m・5m・10m以下に排他的に分類して人口を合計(最低標高基準は上限側の見積りとして別列)。人口の按分はしない',
  ],
  primaryMetricKey: 'lowElevationShareMean5m',
  metricKeys: [
    'lowElevationShareMean5m',
    'lowElevationShareMean0m',
    'lowElevationShareMean10m',
    'lowElevationShareMin5m',
    'population2020',
    'lowElevationPopulationMean5m',
  ],
  /** 主指標を単独のランキングとしても公開している指標。ランキングページからこの分析へ接続する。 */
  relatedRankingKey: 'low-elevation-population-ratio-5m',
  r2Key: 'app/geo/population-low-elevation/item.json',
  evidenceManifestKey: 'app/geo/population-low-elevation/manifest.json',
  detailR2KeyPattern: 'app/geo/population-low-elevation/pref/{NN}.json',
  status: 'ready',
  geography: 'prefecture',
  comparisonLimit: 3,
  expectedObservationCount: 47,
  dataVersion: 'G04-a-11_mesh1000r6-24_2020',
  evidenceCheckedAt: '2026-10-08',
  sourceName:
    '国土交通省「国土数値情報 標高・傾斜度3次メッシュデータ」・「1kmメッシュ別将来推計人口」',
  sourceUrl: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-G04-a.html',
  caveats: [
    '標高は2009年5月時点の約1km単位の平均値で、海抜の低い狭い土地の判定には粗い。都道府県間の相対比較に限る',
    '平均標高が低いことは浸水・高潮・津波が起きることを意味しない。堤防・排水設備・ハザード想定は含まない',
    '0m以下の分類は国土交通省のゼロメートル地帯と同じ定義ではない。5mと10mに全国共通の公的な基準は確認できず、複数のしきい値を並べて読む',
  ],
} as const satisfies BusinessPlanM1Analysis;
