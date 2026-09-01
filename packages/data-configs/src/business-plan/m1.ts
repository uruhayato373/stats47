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
  analysisSlug: string;
  highlightAreaCodes: readonly string[];
}): string {
  if (input.analysisCount !== 1) {
    return input.geoRole === 'decision' ? '/geo/compare' : '/geo/method';
  }
  if (input.analysisSlug === 'population-station-access') {
    const prefCode2 = (input.highlightAreaCodes[0] ?? '13000').slice(0, 2);
    return `/geo/${input.analysisSlug}/${prefCode2}/overlap`;
  }
  return `/geo/${input.analysisSlug}`;
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

export const BUSINESS_PLAN_M1_GEO_ANALYSES = [
  POPULATION_ANALYSIS,
  {
    id: 'm1-analysis-population-land-price',
    contentId: 'geo-016',
    slug: 'population-land-price',
    title: '人口が減る県でも、住宅地の価格は同じように下がるのか',
    question:
      '2050年人口増減率と2026年住宅地の地価水準・変動率にはどんな地域差があるか',
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
      '人口メッシュを都道府県別に集計',
      '住宅地地点の地価中央値を都道府県別に集計',
      '同じ都道府県コードで2指標を結合',
    ],
    primaryMetricKey: 'medianLandPriceChange',
    metricKeys: [
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
    evidenceManifestKey:
      'app/geo/population-station-access/manifest.json',
    detailR2KeyPattern:
      'app/geo/population-station-access/pref/{NN}.json',
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
  const primaryAnalysis = BUSINESS_PLAN_M1_GEO_ANALYSES.find(
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
      analysisSlug: primaryAnalysis.slug,
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
 * 数値は 2026-08-29 生成の47都道府県 Geo snapshot で照合済み。
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
      description: '単一指標の分布を確認し、重ね合わせ分析へ進むための基準地図です。',
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
      description: '人口変化を後続の空間分析で共通して使う基準値として確認します。',
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
    '人口減でも地価上昇は20府県',
    'paradox',
    '人口が減る県では地価も必ず下がるのか。2050年人口が減少見込みでも、2026年の住宅地地価変動率がプラスの地域は20府県ありました。人口メッシュと地価地点を県単位で結合した結果です。\n\n{{url}}\n\n#地価 #将来人口 #地域分析',
    '2026-09-07T19:10:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-land-price'],
    'medianLandPriceChange',
    ['medianLandPriceChange', 'populationChangeRate'],
    {
      description: '人口増減率と地価変動率は同じ方向へ動くとは限りません。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: ['47000', '14000', '27000'],
      panelKind: 'statement',
      panelLabel: '人口減 × 地価上昇',
      panelItems: ['該当：20府県', '相関の観察であり因果ではない'],
    }
  ),
  x(
    5,
    '沖縄は人口-5.21%、地価+6.1%',
    'number',
    '沖縄県は2050年人口が2020年比-5.21%の推計。一方、2026年住宅地の地価変動率中央値は+6.1%です。人口と地価を1指標ずつ眺めるだけでは見えない組み合わせです。\n\n{{url}}\n\n#沖縄 #地価公示 #地域分析',
    '2026-09-09T10:30:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-land-price'],
    'medianLandPriceChange',
    ['medianLandPriceChange', 'populationChangeRate'],
    {
      description: '将来人口と現在の地価変動を、同じ県コードで横断比較します。',
      mapMode: 'focus',
      highlightAreaCodes: ['47000'],
      panelKind: 'statement',
      panelLabel: '沖縄県の2指標',
      panelItems: ['2050年人口：-5.21%', '住宅地地価変動：+6.1%'],
    }
  ),
  x(
    6,
    '地価水準と人口維持は別の問い',
    'question',
    '大阪府の住宅地地価中央値は14.5万円/㎡ですが、2050年人口は2020年比-17.82%の推計です。「地価が高い」と「人口が維持される」を同じ意味にしないための横断分析です。\n\n{{url}}\n\n#大阪 #住宅地 #将来人口',
    '2026-09-11T12:20:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-land-price'],
    'medianResidentialLandPrice',
    ['medianResidentialLandPrice', 'populationChangeRate'],
    {
      description: '地価水準と将来人口を別々に測り、関係を読み違えないようにします。',
      mapMode: 'focus',
      highlightAreaCodes: ['27000'],
      panelKind: 'statement',
      panelLabel: '大阪府の2指標',
      panelItems: ['住宅地中央値：145,000円/㎡', '2050年人口：-17.82%'],
    }
  ),
  x(
    7,
    '新潟は2050年人口の29.8%が区域内',
    'shock',
    '想定最大規模の洪水浸水想定区域と1km将来人口メッシュを重ねると、新潟県は2050年人口の29.8%が区域内と推計されました。メッシュ中心点の包含判定を県別に集計しています。\n\n{{url}}\n\n#防災 #洪水 #地域分析',
    '2026-09-13T08:10:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-flood-risk'],
    'floodExposureShare2050',
    ['floodExposureShare2050', 'exposedPopulation2050'],
    {
      description: '将来人口メッシュと洪水ポリゴンの重なりから導いた人口比率です。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: ['15000'],
      panelKind: 'selected-values',
      panelLabel: '2050年 区域内人口比率',
    }
  ),
  x(
    8,
    '東京は区域内人口316万8442人',
    'number',
    '東京都は2050年の浸水想定区域内人口が3,168,442人、県人口比では22.0%です。人数と比率は別の問い。防災判断には必ず国・自治体の最新ハザードマップを使ってください。\n\n{{url}}\n\n#東京 #ハザードマップ #防災',
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
      panelItems: ['区域内人口：3,168,442人', '県人口比：22.0%'],
    }
  ),
  x(
    9,
    '人口減でも区域内比率は上がり得る',
    'paradox',
    '北海道の浸水想定区域内人口比率は2020年25.8%から2050年27.5%へ+1.7ポイント。総人口が減っても、区域内に残る人口の比率は上がり得ます。比率上昇を人数増加と混同しないことが重要です。\n\n{{url}}\n\n#北海道 #洪水 #将来人口',
    '2026-09-17T21:10:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-flood-risk'],
    'floodExposureShare2050',
    ['floodExposureShare2050', 'floodExposureShare2020'],
    {
      description: '区域内人口の実数だけでなく、総人口に占める構成比の変化を読みます。',
      mapMode: 'focus',
      highlightAreaCodes: ['01000'],
      panelKind: 'statement',
      panelLabel: '北海道・区域内人口比率',
      panelItems: ['2020年：25.8%', '2050年：27.5%', '変化：+1.7ポイント'],
    }
  ),
  x(
    10,
    '東京は2050年人口の69.6%が駅圏',
    'number',
    '駅代表点から直線800m以内に中心点がある1km人口メッシュを集計すると、東京都は2050年人口の69.6%が駅アクセス圏。大阪府65.8%、京都府55.4%でした。\n\n{{url}}\n\n#鉄道 #駅勢圏 #地域分析',
    '2026-09-19T09:30:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-station-access'],
    'stationAccessShare2050',
    ['stationAccessShare2050', 'accessiblePopulation2050'],
    {
      description: '駅位置と人口メッシュの距離判定から導いた2050年人口比率です。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: ['13000', '27000', '26000'],
      panelKind: 'selected-values',
      panelLabel: '2050年 駅800m圏人口比率',
    }
  ),
  x(
    11,
    '東京の駅圏人口は1001万6530人',
    'shock',
    '東京都では2050年に10,016,530人が駅800m圏に暮らす推計です。駅圏人口比率69.6%と、人数1001万6530人は別の指標。割合と規模を同時に見ると交通需要の見え方が変わります。\n\n{{url}}\n\n#東京 #公共交通 #将来人口',
    '2026-09-21T10:20:00+09:00',
    'cross-analysis',
    ['m1-analysis-population-station-access'],
    'accessiblePopulation2050',
    ['accessiblePopulation2050', 'stationAccessShare2050'],
    {
      description: '駅アクセス圏の人口規模と、県人口に占める比率を分けて読みます。',
      mapMode: 'focus',
      highlightAreaCodes: ['13000'],
      panelKind: 'statement',
      panelLabel: '東京都・2050年',
      panelItems: ['駅800m圏人口：10,016,530人', '県人口比：69.6%'],
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
      description: '2020年と2050年の駅圏人口比率を比較し、構成変化を確認します。',
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
    '今回のGeo分析は、地価＝県別集計と指標結合、洪水＝メッシュ中心点のポリゴン包含判定、駅＝代表点から800mの距離判定。AIに数値計算や空間判定を任せず、決定的な処理で再生成します。\n\n{{url}}\n\n#GIS #オープンデータ #地域分析',
    '2026-09-25T09:40:00+09:00',
    'method',
    [
      'm1-analysis-population-land-price',
      'm1-analysis-population-flood-risk',
      'm1-analysis-population-station-access',
    ],
    'medianLandPriceChange',
    ['medianLandPriceChange', 'floodExposureShare2050', 'stationAccessShare2050'],
    {
      description: '分析ごとに異なる空間処理を明示し、再現可能な結果だけを使います。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: [],
      panelKind: 'method',
      panelLabel: '3つの空間処理',
      panelItems: ['地価：県別集計・結合', '洪水：ポリゴン包含判定', '駅：800m距離判定'],
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
    ['floodExposureShare2050', 'stationAccessShare2050', 'medianLandPriceChange'],
    {
      description: '結果の利用範囲を、分析方法と同じレベルで明示します。',
      mapMode: 'derived-choropleth',
      highlightAreaCodes: [],
      panelKind: 'method',
      panelLabel: '判断の停止線',
      panelItems: ['洪水：個別地点の安全判定不可', '駅：実徒歩経路ではない', '地価：因果関係ではない'],
    }
  ),
  x(
    15,
    '1つの県を4つの問いで読む',
    'angle-experience',
    'あなたの県は2050年に何人残るか。住宅地価格はどう動くか。洪水区域内に何人暮らすか。駅800m圏に何人残るか。ランキング1つではなく、4つの問いを同じ地域で比較できます。\n\n{{url}}\n\n#地域比較 #暮らし #stats47',
    '2026-09-29T19:30:00+09:00',
    'decision',
    BUSINESS_PLAN_M1_GEO_ANALYSES.map((analysis) => analysis.id),
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
    '都道府県版の4分析を実画面にし、X 15投稿とnote 15商品を同じ運用台帳で追跡できる状態にする。',
  routes: [
    {
      path: '/geo',
      title: '地域分析ハブ',
      status: 'ready',
      searchVisibility: 'index',
      acceptance: [
        '実データのある分析だけを公開可能として表示する',
        '未検証の市区町村・メッシュ分析を公開済みに見せない',
        '4分析・県別artifact・保存則監査を満たした後だけナビとsitemapへ追加する',
      ],
    },
    {
      path: '/geo/2050-population',
      title: '2050年人口分析',
      status: 'ready',
      searchVisibility: 'index',
      acceptance: [
        '47都道府県の地図・上位下位・県選択・最大3県比較を提供する',
        '出典、基準年、単位、推計の限界を常設表示する',
        '閲覧・地図操作・県選択・比較追加を別イベントで送る',
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
    ...BUSINESS_PLAN_M1_GEO_ANALYSES.slice(1).map((analysis) => ({
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
  analyses: BUSINESS_PLAN_M1_GEO_ANALYSES,
  xPosts: BUSINESS_PLAN_M1_X_POSTS,
  noteProducts: BUSINESS_PLAN_M1_NOTE_PRODUCTS,
  eventIds: ['geo-view', 'map-interaction', 'region-search', 'compare-add'],
  tasks: [
    {
      id: 'm1-site-01',
      workstream: 'site',
      title: '/geoハブと4本の地域分析画面',
      status: 'ready',
      owner: 'site-ux-manager',
      deliverablePath: 'apps/web/src/app/geo/',
      doneWhen:
        '4分析すべてで実データ47件、地図、表、比較、出典、noindexをローカルbuildで確認できる',
    },
    {
      id: 'm1-data-01',
      workstream: 'data',
      title: '都道府県4分析snapshot健全性',
      status: 'ready',
      owner: 'data-ingester',
      deliverablePath: 'app/geo/*/item.json',
      doneWhen: '4分析の47都道府県・単位・出典・入力件数を検証する',
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
