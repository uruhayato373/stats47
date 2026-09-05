import {
  BUSINESS_PLAN_CONTENT_OPPORTUNITIES,
  BUSINESS_PLAN_NOTE_PRODUCTS,
} from './content-opportunities';
import type {
  BusinessPlanM1Analysis,
  BusinessPlanM1ExecutionPlan,
  BusinessPlanM1NoteProduct,
  BusinessPlanM1XPost,
} from './types';

const POPULATION_KEY = 'future-population-change-rate-2050';

export function buildM1XCanonicalUrl(input: {
  analysisCount: number;
  geoRole: BusinessPlanM1XPost['geoRole'];
  analysisKind: BusinessPlanM1Analysis['analysisKind'];
  analysisSlug: string;
  rankingKey?: string;
  highlightAreaCodes: readonly string[];
}): string {
  if (input.analysisCount !== 1) {
    return input.geoRole === 'decision' ? '/geo/compare' : '/geo/method';
  }
  if (input.analysisKind === 'baseline') {
    if (!input.rankingKey) {
      throw new Error('baseline投稿にはrankingKeyが必要です');
    }
    return `/ranking/${input.rankingKey}`;
  }
  const prefCode2 = (input.highlightAreaCodes[0] ?? '13000').slice(0, 2);
  return `/geo/${input.analysisSlug}/${prefCode2}/overlap`;
}

const POPULATION_ANALYSIS = {
  id: 'm1-analysis-population-2050',
  contentId: 'geo-001',
  slug: '2050-population',
  title: '2050年、人口が維持されやすい都道府県はどこか',
  question: '2020年から2050年の人口増減率には、どれくらいの地域差があるか',
  analysisKind: 'baseline',
  sourceLayers: [
    {
      id: 'ipss-prefecture-population',
      label: '都道府県別将来人口',
      geometry: 'prefecture',
      role: 'calculation-input',
      usedInCalculation: true,
    },
  ],
  spatialOperations: ['2020年基準の2050年増減率を算出'],
  primaryMetricKey: POPULATION_KEY,
  metricKeys: [POPULATION_KEY],
  rankingKey: POPULATION_KEY,
  status: 'ready',
  geography: 'prefecture',
  comparisonLimit: 3,
  expectedObservationCount: 47,
  dataVersion: '2050',
  evidenceCheckedAt: '2026-08-29',
  sourceName:
    '国立社会保障・人口問題研究所「日本の地域別将来推計人口（令和5年推計）」',
  sourceUrl: 'https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/t-page.asp',
  caveats: [
    '2020年を基準にした2050年推計人口の増減率であり、将来を保証する値ではない',
    '人口規模そのものや県内の市区町村差はこの都道府県値だけでは判断できない',
    '市区町村・1kmメッシュ版は地域コード、境界、coverageの検証完了後に別段階で扱う',
  ],
} as const satisfies BusinessPlanM1Analysis;

export const BUSINESS_PLAN_M1_BASELINE_ANALYSIS = POPULATION_ANALYSIS;

/** Geo公開面に出せる、証拠manifest付きの複数レイヤー空間分析だけを保持する。 */
export const BUSINESS_PLAN_M1_GEO_ANALYSES = [
  {
    id: 'm1-analysis-population-land-price',
    contentId: 'geo-016',
    slug: 'population-land-price',
    title: '地価が上がる住宅地でも、周囲の人口は減るのか',
    question:
      '2026年の住宅地価上昇地点と、2020→2050年に人口が減る1kmメッシュはどこで重なるか',
    analysisKind: 'spatial-cross',
    sourceLayers: [
      {
        id: 'ipss-population-mesh-1km',
        label: '1km将来人口メッシュ',
        geometry: 'mesh',
        role: 'calculation-input',
        usedInCalculation: true,
      },
      {
        id: 'ksj-l01-residential-land-price',
        label: '住宅地の地価公示地点',
        geometry: 'point',
        role: 'calculation-input',
        usedInCalculation: true,
      },
    ],
    spatialOperations: [
      '住宅地点座標を同じ県の1km人口メッシュ境界へ包含判定で接続（西・南を含み東・北を含まない）',
      '地価上昇と包含メッシュの将来人口減少を地点単位で照合。未接続・変動率欠測・基準人口0は比較対象外',
      '比較可能地点を分母に、地価上昇かつ人口減少地点の割合を県別集計。地点を人口で重み付けしない',
    ],
    primaryMetricKey: 'risingDecliningPointShare',
    metricKeys: [
      'risingDecliningPointShare',
      'risingDecliningPointCount',
      'comparablePointCount',
      'matchedPointCount',
      'unmatchedPointCount',
      'medianResidentialLandPrice',
      'medianLandPriceChange',
      'populationChangeRate',
      'population2050',
      'sampleCount',
    ],
    r2Key: 'app/geo/population-land-price/item.json',
    evidenceManifestKey: 'app/geo/population-land-price/manifest.json',
    detailR2KeyPattern: 'app/geo/population-land-price/pref/{NN}.json',
    status: 'ready',
    geography: 'prefecture',
    comparisonLimit: 3,
    expectedObservationCount: 47,
    dataVersion: '2020-2050',
    evidenceCheckedAt: '2026-08-29',
    sourceName: '国土交通省「地価公示」・1kmメッシュ別将来推計人口',
    sourceUrl:
      'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-L01-2026.html',
    caveats: [
      '地価公示は標準地点の観測であり、県内すべての土地価格を代表しない',
      '人口変化との関係は相関の観察であり、因果関係を示さない',
      '地価は2025→2026年、人口は2020→2050年の比較で期間が異なる。将来地価を予測しない',
      '約1kmメッシュの人口を地点の居住人数や徒歩圏と解釈しない。未接続地点は人口0ではない',
    ],
  },
  {
    id: 'm1-analysis-population-flood-risk',
    contentId: 'geo-031',
    slug: 'population-flood-risk',
    title: '2050年、洪水浸水想定区域に暮らす人口はどれくらいか',
    question:
      '想定最大規模の洪水浸水想定区域と1km将来人口メッシュを重ねると、地域差はどう見えるか',
    analysisKind: 'spatial-cross',
    sourceLayers: [
      {
        id: 'ipss-population-mesh-1km',
        label: '1km将来人口メッシュ',
        geometry: 'mesh',
        role: 'calculation-input',
        usedInCalculation: true,
      },
      {
        id: 'ksj-a31b-flood-polygon',
        label: '洪水浸水想定区域',
        geometry: 'polygon',
        role: 'calculation-input',
        usedInCalculation: true,
      },
    ],
    spatialOperations: [
      '人口メッシュ中心点のポリゴン包含判定',
      '区域内人口を都道府県別に集計',
    ],
    primaryMetricKey: 'floodExposureShare2050',
    metricKeys: [
      'floodExposureShare2050',
      'floodExposureShare2020',
      'exposedPopulation2050',
      'populationChangeRate',
      'exposedMeshCount',
    ],
    r2Key: 'app/geo/population-flood-risk/item.json',
    evidenceManifestKey: 'app/geo/population-flood-risk/manifest.json',
    detailR2KeyPattern: 'app/geo/population-flood-risk/pref/{NN}.json',
    status: 'ready',
    geography: 'prefecture',
    comparisonLimit: 3,
    expectedObservationCount: 47,
    dataVersion: '2020-2050',
    evidenceCheckedAt: '2026-08-29',
    sourceName: '国土交通省「洪水浸水想定区域」・1kmメッシュ別将来推計人口',
    sourceUrl:
      'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31b-2025.html',
    caveats: [
      '避難判断や個別地点の安全確認には使わず、国と自治体の最新ハザードマップを確認する',
      '区域外で洪水が起きないことを意味しない',
    ],
  },
  {
    id: 'm1-analysis-population-station-access',
    contentId: 'geo-062',
    slug: 'population-station-access',
    title: '2050年、駅の近くに住む人口はどれくらい残るのか',
    question:
      '鉄道駅から直線800m以内の1kmメッシュ人口は、2020年から2050年にどう変わるか',
    analysisKind: 'spatial-cross',
    sourceLayers: [
      {
        id: 'ipss-population-mesh-1km',
        label: '1km将来人口メッシュ',
        geometry: 'mesh',
        role: 'calculation-input',
        usedInCalculation: true,
      },
      {
        id: 'ksj-s12-station-point',
        label: '鉄道駅代表点',
        geometry: 'point',
        role: 'calculation-input',
        usedInCalculation: true,
      },
      {
        id: 'ksj-s12-passenger-context',
        label: '駅別乗降客数（補助）',
        geometry: 'point',
        role: 'context-only',
        usedInCalculation: false,
      },
    ],
    spatialOperations: [
      '駅代表点から直線800mの距離判定',
      '圏内人口を都道府県別に集計',
    ],
    primaryMetricKey: 'stationAccessShare2050',
    metricKeys: [
      'stationAccessShare2050',
      'stationAccessShare2020',
      'accessiblePopulation2050',
      'populationChangeRate',
      'accessibleMeshCount',
    ],
    r2Key: 'app/geo/population-station-access/item.json',
    evidenceManifestKey: 'app/geo/population-station-access/manifest.json',
    detailR2KeyPattern: 'app/geo/population-station-access/pref/{NN}.json',
    status: 'ready',
    geography: 'prefecture',
    comparisonLimit: 3,
    expectedObservationCount: 47,
    dataVersion: '2020-2050',
    evidenceCheckedAt: '2026-08-29',
    sourceName: '国土交通省「駅別乗降客数」・1kmメッシュ別将来推計人口',
    sourceUrl:
      'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S12-2024.html',
    caveats: [
      '800mは直線距離で、実際の徒歩経路や高低差を表さない',
      '1kmメッシュ中心点による近似である',
    ],
  },
] as const satisfies readonly BusinessPlanM1Analysis[];

/** X・note・横断比較では、基準ランキングを含む全4系列を参照する。 */
export const BUSINESS_PLAN_M1_ANALYSES = [
  BUSINESS_PLAN_M1_BASELINE_ANALYSIS,
  ...BUSINESS_PLAN_M1_GEO_ANALYSES,
] as const satisfies readonly BusinessPlanM1Analysis[];

const x = (
  index: number,
  title: string,
  template: BusinessPlanM1XPost['template'],
  caption: string,
  scheduledAt: string,
  geoRole: BusinessPlanM1XPost['geoRole'],
  analysisIds: readonly string[],
  claimMetricKey: string,
  metricKeys: readonly string[],
  visual: BusinessPlanM1XPost['visual']
): BusinessPlanM1XPost => {
  const primaryAnalysis = BUSINESS_PLAN_M1_ANALYSES.find(
    (analysis) => analysis.id === analysisIds[0]
  );
  if (!primaryAnalysis) {
    throw new Error(`Geo X投稿の分析が未定義です: ${analysisIds[0] ?? 'none'}`);
  }
  const contentKey = `geo-001-x-${String(index).padStart(2, '0')}`;
  return {
    id: `m1-x-${String(index).padStart(2, '0')}`,
    contentKey,
    title,
    geoRole,
    analysisIds,
    claimMetricKey,
    template,
    caption,
    scheduledAt,
    canonicalUrl: buildM1XCanonicalUrl({
      analysisCount: analysisIds.length,
      geoRole,
      analysisKind: primaryAnalysis.analysisKind,
      analysisSlug: primaryAnalysis.slug,
      rankingKey:
        'rankingKey' in primaryAnalysis
          ? primaryAnalysis.rankingKey
          : undefined,
      highlightAreaCodes: visual.highlightAreaCodes,
    }),
    campaign: primaryAnalysis.contentId,
    imageKind: 'geo-insight-card',
    mediaKey: primaryAnalysis.slug,
    mediaPath: `.local/r2/sns/geo/${contentKey}/x/stills/${contentKey}.png`,
    metricKeys,
    visual,
    status: 'ready',
  };
};

/**
 * 2026年9月の初期15投稿。入口3、空間横断分析9、方法2、意思決定1の構成を固定する。
 * 数値は 2026-09-05 修正版の47都道府県 Geo snapshot で照合済み。
 * URL は register 時に {{url}} を決定的な UTM URL へ置換する。
 */
export const BUSINESS_PLAN_M1_X_POSTS: readonly BusinessPlanM1XPost[] = [
  x(
    1,
    '2050年、人口増は東京だけ',
    'shock',
    '2050年の推計人口を2020年と比べると、増加は東京都の+2.50%だけ。46道府県は減少見込みです。これはGeo分析の入口。次の投稿から地価・洪水・駅を重ねます。\n\n{{url}}\n\n#将来人口 #地域分析 #stats47',
    '2026-09-01T08:00:00+09:00',
    'baseline',
    ['m1-analysis-population-2050'],
    POPULATION_KEY,
    [POPULATION_KEY],
    {
      description:
        '単一指標の分布を確認し、重ね合わせ分析へ進むための基準地図です。',
      mapMode: 'baseline-choropleth',
      highlightAreaCodes: ['13000'],
      panelKind: 'statement',
      panelLabel: '2020年 → 2050年',
      panelItems: ['人口増加：1都', '人口減少：46道府県'],
    }
  ),
  x(
    2,
    '人口変化の幅は44.09ポイント',
    'versus',
    '東京都+2.50%、秋田県-41.59%。同じ2050年推計でも44.09ポイントの幅があります。高低を知るだけで終わらず、この差が地価・洪水・駅アクセスとどう重なるかを分析します。\n\n{{url}}\n\n#人口減少 #地域差 #stats47',
    '2026-09-03T12:10:00+09:00',
    'baseline',
    ['m1-analysis-population-2050'],
    POPULATION_KEY,
    [POPULATION_KEY],
    {
      description:
        '人口変化を後続の空間分析で共通して使う基準値として確認します。',
      mapMode: 'focus',
      highlightAreaCodes: ['13000', '05000'],
      panelKind: 'selected-values',
      panelLabel: '人口増減率の両端',
    }
  ),
  x(
    3,
    'コロプレスは答えではなく入口',
    'angle-howto',
    '人口の色分け地図だけでは、住みやすさも安全性も分かりません。①人口変化を確認 ②別データを重ねる ③方法と限界を読む。この順で地域を分析します。\n\n{{url}}\n\n#GIS #データ活用 #stats47',
    '2026-09-05T09:20:00+09:00',
    'baseline',
    ['m1-analysis-population-2050'],
    POPULATION_KEY,
    [POPULATION_KEY],
    {
      description: '単一指標と複合分析を混同しない、Geoシリーズの読み方です。',
      mapMode: 'baseline-choropleth',
      highlightAreaCodes: [],
      panelKind: 'method',
      panelLabel: '地域分析の3段階',
      panelItems: ['人口分布を確認', '別レイヤーを重ねる', '方法・限界を確認'],
    }
  ),
  x(
    4,
    '人口減のメッシュでも地価は上がる',
    'paradox',
    '地価が上がる住宅地でも、周囲の人口は減るのか。沖縄県では比較可能119地点中78地点（65.5%）で、2025→2026年の地価上昇と2020→2050年の人口減少推計が重なりました。地点を1km人口メッシュへ包含判定した結果で、人口の割合ではありません。\n\n{{url}}\n\n#地価 #将来人口 #地域分析',
    '2026-09-07T19:10:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-land-price'],
    'risingDecliningPointShare',
    ['risingDecliningPointShare', 'comparablePointCount'],
    {
      description: '住宅地点を包含する人口メッシュの将来変化と照合します。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: ['47000', '14000', '27000'],
      panelKind: 'statement',
      panelLabel: '人口減 × 地価上昇',
      panelItems: [
        '沖縄：78 / 119地点（65.5%）',
        '地点比率であり人口比率ではない',
      ],
    }
  ),
  x(
    5,
    '沖縄の重なりは78 / 119地点',
    'number',
    '沖縄県では人口メッシュに接続した住宅地122地点のうち、比較可能119地点が分母です。地価上昇と将来人口減少が重なるのは78地点、65.5%。県平均の併置ではなく同じ場所で照合。期間の異なる比較で、将来地価の予測ではありません。\n\n{{url}}\n\n#沖縄 #地価公示 #地域分析',
    '2026-09-09T10:30:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-land-price'],
    'risingDecliningPointShare',
    ['risingDecliningPointShare', 'comparablePointCount'],
    {
      description:
        '地点座標で包含メッシュへ接続し、比較可能地点だけを分母にします。',
      mapMode: 'focus',
      highlightAreaCodes: ['47000'],
      panelKind: 'statement',
      panelLabel: '沖縄県・地点の重なり',
      panelItems: ['重なり：78 / 119地点', '地点比率：65.5%'],
    }
  ),
  x(
    6,
    '大阪の住宅地、869地点で重なる',
    'question',
    '大阪府では比較可能な住宅地1,181地点中869地点（73.6%）で、現在の地価上昇と周囲1kmメッシュの将来人口減少が重なります。地価は2025→2026年、人口は2020→2050年。同期間の因果関係や将来価格を示す値ではありません。\n\n{{url}}\n\n#大阪 #住宅地 #将来人口',
    '2026-09-11T12:20:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-land-price'],
    'risingDecliningPointShare',
    ['risingDecliningPointShare', 'comparablePointCount'],
    {
      description:
        '住宅地点と包含メッシュを接続し、時期と分母を明示して読みます。',
      mapMode: 'focus',
      highlightAreaCodes: ['27000'],
      panelKind: 'statement',
      panelLabel: '大阪府・地点の重なり',
      panelItems: ['重なり：869 / 1,181地点', '地点比率：73.6%'],
    }
  ),
  x(
    7,
    '新潟は中心点判定で62.1%が区域内',
    'shock',
    '想定最大規模の洪水区域に中心点が入る1kmメッシュの2050年人口を合計すると、新潟県は62.1%。メッシュ人口全体を中心点で割り当てる概算で、実際の浸水人口や災害確率ではありません。最新の自治体ハザードマップと併せて確認してください。\n\n{{url}}\n\n#防災 #洪水 #地域分析',
    '2026-09-13T08:10:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-flood-risk'],
    'floodExposureShare2050',
    ['floodExposureShare2050', 'exposedPopulation2050'],
    {
      description:
        '将来人口メッシュと洪水ポリゴンの重なりから導いた人口比率です。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: ['15000'],
      panelKind: 'selected-values',
      panelLabel: '2050年 区域内人口比率',
    }
  ),
  x(
    8,
    '東京は中心点判定で660万3525人',
    'number',
    '東京都では、洪水浸水想定区域に中心点が入る1kmメッシュの2050年人口合計は6,603,525人、都人口比45.9%。実際の浸水人口ではなく中心点で割り当てた概算です。防災判断には国・自治体の最新ハザードマップを使ってください。\n\n{{url}}\n\n#東京 #ハザードマップ #防災',
    '2026-09-15T08:20:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-flood-risk'],
    'exposedPopulation2050',
    ['exposedPopulation2050', 'floodExposureShare2050'],
    {
      description: '区域内人口の実数と、県人口に占める比率を分けて読みます。',
      mapMode: 'focus',
      highlightAreaCodes: ['13000'],
      panelKind: 'statement',
      panelLabel: '東京都・2050年',
      panelItems: ['中心点判定：6,603,525人', '都人口比：45.9%'],
    }
  ),
  x(
    9,
    '人口減でも区域内比率は上がり得る',
    'paradox',
    '北海道では、洪水区域に中心点が入る1kmメッシュの人口比率が2020年49.2%から2050年52.6%へ。表示値の差は+3.4ポイントですが、比率上昇は人数増加を意味しません。中心点による概算で、実際の浸水人口ではありません。\n\n{{url}}\n\n#北海道 #洪水 #将来人口',
    '2026-09-17T21:10:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-flood-risk'],
    'floodExposureShare2050',
    ['floodExposureShare2050', 'floodExposureShare2020'],
    {
      description:
        '区域内人口の実数だけでなく、総人口に占める構成比の変化を読みます。',
      mapMode: 'focus',
      highlightAreaCodes: ['01000'],
      panelKind: 'statement',
      panelLabel: '北海道・区域内人口比率',
      panelItems: [
        '2020年：49.2%',
        '2050年：52.6%',
        '表示差：+3.4ポイント',
      ],
    }
  ),
  x(
    10,
    '東京は中心点判定で70.8%が駅圏',
    'number',
    '駅代表点から直線800m以内に中心点がある1km人口メッシュを集計すると、東京都は2050年人口の70.8%。大阪府65.8%、京都府55.0%でした。中心点で人口を割り当てた概算で、実際の徒歩800m圏ではありません。\n\n{{url}}\n\n#鉄道 #駅勢圏 #地域分析',
    '2026-09-19T09:30:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-station-access'],
    'stationAccessShare2050',
    ['stationAccessShare2050', 'accessiblePopulation2050'],
    {
      description:
        '駅位置と人口メッシュの距離判定から導いた2050年人口比率です。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: ['13000', '27000', '26000'],
      panelKind: 'selected-values',
      panelLabel: '2050年 駅800m圏人口比率',
    }
  ),
  x(
    11,
    '東京の駅圏は概算1019万6427人',
    'shock',
    '東京都では、駅代表点から直線800m以内に中心点があるメッシュの2050年人口合計は10,196,427人、都人口比70.8%。1kmメッシュ人口を中心点で割り当てる概算です。実際の徒歩圏や利用客数ではなく、割合と規模を分けて読みます。\n\n{{url}}\n\n#東京 #公共交通 #将来人口',
    '2026-09-21T10:20:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-station-access'],
    'accessiblePopulation2050',
    ['accessiblePopulation2050', 'stationAccessShare2050'],
    {
      description:
        '駅アクセス圏の人口規模と、県人口に占める比率を分けて読みます。',
      mapMode: 'focus',
      highlightAreaCodes: ['13000'],
      panelKind: 'statement',
      panelLabel: '東京都・2050年',
      panelItems: ['中心点判定：10,196,427人', '都人口比：70.8%'],
    }
  ),
  x(
    12,
    '38都道府県で駅圏比率が上昇',
    'question',
    '2020年から2050年に駅800m圏人口の比率が上がる推計は38都道府県。ただし、比率上昇は駅圏人口そのものの増加を意味しません。人口減少の場所によって構成比は変わります。\n\n{{url}}\n\n#コンパクトシティ #鉄道 #地域分析',
    '2026-09-23T19:20:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-station-access'],
    'stationAccessShare2050',
    ['stationAccessShare2050', 'stationAccessShare2020'],
    {
      description:
        '2020年と2050年の駅圏人口比率を比較し、構成変化を確認します。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: ['01000', '04000', '34000'],
      panelKind: 'statement',
      panelLabel: '比率が上昇する地域',
      panelItems: ['38都道府県で上昇', '比率上昇 ≠ 駅圏人口の増加'],
    }
  ),
  x(
    13,
    'Geo分析は3つの空間処理で作る',
    'angle-howto',
    '今回のGeo分析は、地価＝地点を人口メッシュへ包含判定で接続、洪水＝メッシュ中心点のポリゴン包含判定、駅＝代表点から800mの距離判定。AIに数値計算や空間判定を任せず、入力・途中データ・集計まで決定的な処理で再生成します。\n\n{{url}}\n\n#GIS #オープンデータ #地域分析',
    '2026-09-25T09:40:00+09:00',
    'method',
    [
      'm1-analysis-population-land-price',
      'm1-analysis-population-flood-risk',
      'm1-analysis-population-station-access',
    ],
    'risingDecliningPointShare',
    [
      'risingDecliningPointShare',
      'floodExposureShare2050',
      'stationAccessShare2050',
    ],
    {
      description:
        '分析ごとに異なる空間処理を明示し、再現可能な結果だけを使います。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: [],
      panelKind: 'method',
      panelLabel: '3つの空間処理',
      panelItems: [
        '地価：地点を人口メッシュへ接続',
        '洪水：ポリゴン包含判定',
        '駅：800m距離判定',
      ],
    }
  ),
  x(
    14,
    'Geo地図にも答えられないことがある',
    'shock',
    '洪水区域外を安全とは判定できない。駅800mは実際の徒歩経路ではない。人口と地価の関係は因果を示さない。Geo分析では、地図と同じ面積で「答えられないこと」も管理します。\n\n{{url}}\n\n#データリテラシー #GIS #地域分析',
    '2026-09-27T08:30:00+09:00',
    'method',
    [
      'm1-analysis-population-flood-risk',
      'm1-analysis-population-station-access',
      'm1-analysis-population-land-price',
    ],
    'floodExposureShare2050',
    [
      'floodExposureShare2050',
      'stationAccessShare2050',
      'medianLandPriceChange',
    ],
    {
      description: '結果の利用範囲を、分析方法と同じレベルで明示します。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: [],
      panelKind: 'method',
      panelLabel: '判断の停止線',
      panelItems: [
        '洪水：個別地点の安全判定不可',
        '駅：実徒歩経路ではない',
        '地価：因果関係ではない',
      ],
    }
  ),
  x(
    15,
    '1つの県を4つの問いで読む',
    'angle-experience',
    'あなたの県は2050年に何人残るか。住宅地価格はどう動くか。洪水区域内に何人暮らすか。駅800m圏に何人残るか。ランキング1つではなく、4つの問いを同じ地域で比較できます。\n\n{{url}}\n\n#地域比較 #暮らし #stats47',
    '2026-09-29T19:30:00+09:00',
    'decision',
    BUSINESS_PLAN_M1_ANALYSES.map((analysis) => analysis.id),
    POPULATION_KEY,
    [
      POPULATION_KEY,
      'medianLandPriceChange',
      'floodExposureShare2050',
      'stationAccessShare2050',
    ],
    {
      description: '人口・住まい・防災・交通を、同じ都道府県から横断します。',
      mapMode: 'baseline-choropleth',
      highlightAreaCodes: [],
      panelKind: 'layers',
      panelLabel: '同じ県で見る4つの問い',
      panelItems: ['将来人口', '人口 × 地価', '人口 × 洪水', '人口 × 駅800m圏'],
    }
  ),
];

const NOTE_KEYS = [
  'd-geo-ipss-prefecture-map',
  'd-geo-region-code-checklist',
  'd-geo-flood-population-mesh',
  'd-geo-ksj-qgis-guide',
  'd-geo-land-price-future-population',
  'd-geo-x-ogp-map-automation',
  'd-geo-medical-access-analysis',
  'd-geo-geopackage-parquet-pmtiles',
  'd-geo-data-quality-management',
  'd-geo-station-access-analysis',
  'd-geo-trade-area-analysis',
  'd-geo-poi-license-practice',
  'd-geo-natural-language-region-filter',
  'd-geo-pyqgis-ai-verification',
  'd-geo-analysis-template-compendium',
] as const;

const NOTE_OUTCOMES = [
  'IPSSの将来人口を47都道府県コード付きで比較し、地図用データとして再利用できる',
  '県・市区町村コードの欠落、桁、境界変更を公開前に検査できる',
  '洪水ポリゴンと人口メッシュの重なりを再現可能な手順で集計できる',
  '国土数値情報をQGISで読み込み、CRSと属性を検証できる',
  '地価地点と将来人口を混同せず都道府県単位で比較できる',
  '1つの地図からX画像とOGPを規約どおり派生できる',
  '人口に対する医療アクセスを距離定義つきで分析できる',
  '用途に応じてGeoPackage、Parquet、PMTilesを選べる',
  'provenance、単位、分布、coverageの品質ゲートを構築できる',
  '駅代表点と1km人口メッシュ中心の直線800m判定による47都道府県集計を検算・再利用できる',
  '人口、競合、アクセスを使った基礎商圏分析を再現できる',
  'POIデータの利用条件を確認し、公開可否を判断できる',
  '自然言語の条件を検証可能な地域フィルタJSONへ変換できる',
  'AI生成PyQGISコードを小さな検証データで監査できる',
  '12か月分の地域分析を共通テンプレートで再利用できる',
] as const;

export const BUSINESS_PLAN_M1_NOTE_PRODUCTS: readonly BusinessPlanM1NoteProduct[] =
  BUSINESS_PLAN_NOTE_PRODUCTS.map((product, index) => ({
    id: product.id,
    articleKey: NOTE_KEYS[index],
    title: product.title,
    priceYen: product.priceYen,
    sourceContentIds:
      index === 0
        ? ['geo-001']
        : index === 2
          ? ['geo-031']
          : index === 4
            ? ['geo-016']
            : index === 9
              ? ['geo-062']
              : [],
    readerOutcome: NOTE_OUTCOMES[index],
    deliverables: ['本文', '再現手順', '検証チェックリスト', '出典・利用条件'],
    status: index < 2 ? 'in-progress' : 'gated',
    readinessGate:
      index < 2
        ? '本文・図・一次資料・再現テストが揃い、note公開前レビューを通過する'
        : '対応する無料分析の需要とデータ品質を確認してから本文制作を開始する',
  }));

export const BUSINESS_PLAN_M1: BusinessPlanM1ExecutionPlan = {
  month: '2026-09',
  objective:
    '3つの空間分析と1つの基準ランキングを公開面で分離し、X 15投稿とnote 15商品を同じ運用台帳で追跡できる状態にする。',
  routes: [
    {
      path: '/geo',
      title: '地域分析ハブ',
      status: 'ready',
      searchVisibility: 'index',
      acceptance: [
        '実データのある分析だけを公開可能として表示する',
        '未検証の市区町村・メッシュ分析を公開済みに見せない',
        '3分析・県別artifact・保存則監査を満たした後だけナビとsitemapへ追加する',
        '単一指標の基準データはランキングへ接続し、Geo分析として列挙しない',
      ],
    },
    {
      path: '/geo/compare',
      title: '1県を4つの問いで横断比較',
      status: 'ready',
      searchVisibility: 'index',
      acceptance: [
        '都道府県を1回選ぶと人口・地価・洪水・駅の4結果が同時に変わる',
        '3分析すべてが47都道府県揃わなければ公開表示を止める',
        '各結果から対応する地図・全県表・方法へ遷移できる',
      ],
    },
    {
      path: '/geo/method',
      title: 'GeoAI地域分析の方法・限界',
      status: 'ready',
      searchVisibility: 'index',
      acceptance: [
        '3つの空間演算と入力geometryを分析別に示す',
        '個別地点の安全・徒歩経路・因果を判定できないことを示す',
        '各分析の結果・一次資料・データカタログへ遷移できる',
      ],
    },
    ...BUSINESS_PLAN_M1_GEO_ANALYSES.map((analysis) => ({
      path: `/geo/${analysis.slug}`,
      title: analysis.title,
      status: analysis.status,
      searchVisibility: 'index' as const,
      acceptance: [
        '47都道府県の地図・全県表・県選択・最大3県比較を提供する',
        '方法、一次資料、データ品質、限界を常設表示する',
        'R2 snapshotが欠損またはcoverage不良なら公開表示を止める',
      ],
    })),
  ],
  analysis: POPULATION_ANALYSIS,
  analyses: BUSINESS_PLAN_M1_ANALYSES,
  xPosts: BUSINESS_PLAN_M1_X_POSTS,
  noteProducts: BUSINESS_PLAN_M1_NOTE_PRODUCTS,
  eventIds: ['geo-view', 'map-interaction', 'region-search', 'compare-add'],
  tasks: [
    {
      id: 'm1-site-01',
      workstream: 'site',
      title: '/geoハブと3本の空間分析画面',
      status: 'ready',
      owner: 'site-ux-manager',
      deliverablePath: 'apps/web/src/app/geo/',
      doneWhen:
        '3空間分析すべてで実データ47件、途中artifact、地図、表、比較、出典をローカルbuildで確認でき、基準ランキングがGeo一覧に混入しない',
    },
    {
      id: 'm1-data-01',
      workstream: 'data',
      title: '都道府県3空間分析snapshot健全性',
      status: 'ready',
      owner: 'data-ingester',
      deliverablePath: 'app/geo/*/item.json',
      doneWhen: '3空間分析の47都道府県・単位・出典・入力件数・保存則を検証する',
    },
    {
      id: 'm1-x-01',
      workstream: 'x',
      title: '初回15投稿をX投稿台帳へdraft登録',
      status: 'ready',
      owner: 'x-strategist',
      deliverablePath: '.claude/state/sns/posts.json',
      doneWhen:
        '15件すべてlint PASSし、content_keyとscheduled_at付きdraftとして存在する',
    },
    {
      id: 'm1-note-01',
      workstream: 'note',
      title: '15商品をnoteカタログへ登録',
      status: 'ready',
      owner: 'note-manager',
      deliverablePath: '.claude/scripts/note/catalog/data/stats47-note.ts',
      doneWhen:
        '15件の価格・記事key・本文有無・公開ゲートを管理画面で確認できる',
    },
    {
      id: 'm1-measure-01',
      workstream: 'measurement',
      title: 'Geo行動イベント実装',
      status: 'in-progress',
      owner: 'ga4-analyst',
      deliverablePath: 'apps/web/src/lib/analytics/events.ts',
      doneWhen: '4イベントのコード、テスト、GA4登録台帳、反映確認が揃う',
    },
    {
      id: 'm1-release-01',
      workstream: 'release',
      title: '公開判定',
      status: 'gated',
      owner: 'strategy-advisor',
      deliverablePath: 'apps/admin/app/strategy/page.tsx',
      doneWhen:
        '全ローカルゲートPASS後、所有者の明示承認を得て1回だけdeployする',
    },
  ],
  releaseGates: [
    'Web対象テスト・type-check・buildがPASS',
    'X 15件が投稿台帳にdraft登録され、外部投稿は未実行',
    'note 15件がカタログ登録され、本文未作成商品は公開不可と表示',
    'GA4カスタムディメンション登録と24〜48時間後の反映確認までは部分計測とする',
    '追加R2 push・X投稿・note公開・本番deployは、対象差分ごとに所有者の明示承認を得る',
  ],
};

if (BUSINESS_PLAN_CONTENT_OPPORTUNITIES[0]?.id !== 'geo-001') {
  throw new Error(
    'business-plan M1: geo-001 がコンテンツカタログ先頭にありません'
  );
}
