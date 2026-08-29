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

const ANALYSIS_PATH = '/geo/2050-population';
const POPULATION_KEY = 'future-population-change-rate-2050';

const POPULATION_ANALYSIS = {
  id: 'm1-analysis-population-2050',
  contentId: 'geo-001',
  slug: '2050-population',
  title: '2050年、人口が維持されやすい都道府県はどこか',
  question: '2020年から2050年の人口増減率には、どれくらいの地域差があるか',
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
    r2Key: 'app/geo/population-land-price/item.json',
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
    r2Key: 'app/geo/population-flood-risk/item.json',
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
    r2Key: 'app/geo/population-station-access/item.json',
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
  imageKind: BusinessPlanM1XPost['imageKind'] = 'ranking-card'
): BusinessPlanM1XPost => ({
  id: `m1-x-${String(index).padStart(2, '0')}`,
  contentKey: `geo-001-x-${String(index).padStart(2, '0')}`,
  title,
  template,
  caption,
  scheduledAt,
  canonicalUrl: ANALYSIS_PATH,
  campaign: 'geo-001',
  imageKind,
  mediaKey: POPULATION_KEY,
  metricKeys: [POPULATION_KEY],
  status: 'ready',
});

/**
 * 2026年9月の初期15投稿。数値は 2026-08-27 生成の47都道府県 snapshot で照合済み。
 * URL は register 時に {{url}} を決定的な UTM URL へ置換する。
 */
export const BUSINESS_PLAN_M1_X_POSTS: readonly BusinessPlanM1XPost[] = [
  x(
    1,
    '人口増が見込まれるのは東京だけ',
    'shock',
    '2050年の人口増減率を47都道府県で比較すると、プラスは東京都の+2.50%だけ。46道府県はマイナスです。地図で全体像を確認できます。\n\n{{url}}\n\n#都道府県 #将来人口 #stats47',
    '2026-09-01T08:00:00+09:00'
  ),
  x(
    2,
    '東京と秋田の44.09ポイント差',
    'versus',
    '東京都+2.50%と秋田県-41.59%。2020年から2050年の将来人口増減率には44.09ポイントの差があります。あなたの県はどちらに近いですか。\n\n{{url}}\n\n#地域データ #人口減少 #stats47',
    '2026-09-03T12:10:00+09:00'
  ),
  x(
    3,
    '人口減少が比較的緩やかな県',
    'number',
    '東京+2.50%、沖縄-5.21%、神奈川-7.72%、千葉-9.46%。2050年人口の変化が比較的緩やかな上位県を地図と表で比べました。\n\n{{url}}\n\n#統計 #人口予測 #stats47',
    '2026-09-05T09:20:00+09:00'
  ),
  x(
    4,
    '46道府県が減少見込みになる理由を考える入口',
    'question',
    'なぜ2050年の人口増減率は46道府県でマイナスなのか。まずは地域差の大きさを地図で把握し、出生・移動・年齢構成を別指標で確かめるのが入口です。\n\n{{url}}\n\n#都道府県比較 #将来推計 #stats47',
    '2026-09-07T19:10:00+09:00'
  ),
  x(
    5,
    '大都市圏でも一様ではない',
    'paradox',
    '「大都市圏なら人口は維持される」とは限りません。東京都+2.50%に対し、大阪府は-17.82%、京都府は-19.48%。同じ都市圏でも差があります。\n\n{{url}}\n\n#都市データ #人口減少 #stats47',
    '2026-09-09T10:30:00+09:00'
  ),
  x(
    6,
    '三大都市圏の将来人口を比較',
    'versus',
    '2050年人口増減率は東京+2.50%、愛知-11.48%、大阪-17.82%。三大都市圏を一括りにせず、県ごとの差を見ると変化の輪郭がはっきりします。\n\n{{url}}\n\n#三大都市圏 #人口統計 #stats47',
    '2026-09-11T12:20:00+09:00'
  ),
  x(
    7,
    '地方圏で減少が緩やかな県',
    'shock',
    '地方圏で2050年人口の減少が比較的緩やかなのは沖縄県-5.21%、福岡県-12.78%、滋賀県-13.50%。全国地図で位置関係まで見られます。\n\n{{url}}\n\n#地方創生 #人口動態 #stats47',
    '2026-09-13T08:10:00+09:00'
  ),
  x(
    8,
    '東北3県の厳しい推計',
    'number',
    '秋田-41.59%、青森-39.03%、岩手-35.30%。2050年人口増減率の下位3県はいずれも東北です。順位だけでなく差の幅を確認しました。\n\n{{url}}\n\n#東北 #地域課題 #stats47',
    '2026-09-15T08:20:00+09:00'
  ),
  x(
    9,
    'あなたの県を選んで比較',
    'angle-experience',
    'もし今住む県の人口が2050年に2割減るなら、住まい・交通・医療の見え方も変わります。都道府県を選び、最大3県まで同じ画面で比較できます。\n\n{{url}}\n\n#暮らし #地域比較 #stats47',
    '2026-09-17T21:10:00+09:00'
  ),
  x(
    10,
    '将来人口データの読み方',
    'angle-howto',
    '将来人口データを見る3手順。①基準年を確認 ②増減率と実数を分ける ③推計は予測条件つきと理解する。今回の画面には出典と注意点もまとめました。\n\n{{url}}\n\n#データ活用 #統計リテラシー #stats47',
    '2026-09-19T09:30:00+09:00'
  ),
  x(
    11,
    '人口増減率と人口規模は別物',
    'paradox',
    '人口増減率の上位県が「人口の多い県」とは限りません。変化率は2020年を基準にした割合。人口規模と混同せず、別の問いとして読む必要があります。\n\n{{url}}\n\n#統計の見方 #将来人口 #stats47',
    '2026-09-21T10:20:00+09:00'
  ),
  x(
    12,
    '全国中央値で見る人口減少',
    'question',
    'ランキングの1位と47位だけで地域差を判断していませんか。全国中央値と自分の県を同じ画面で比べると、極端な県に引っ張られず現在地を読めます。\n\n{{url}}\n\n#データ可視化 #都道府県 #stats47',
    '2026-09-23T19:20:00+09:00'
  ),
  x(
    13,
    '地図と表を往復して読む',
    'angle-howto',
    '地域データは①地図で偏りを発見 ②表で正確な値を確認 ③比較リストで候補を絞る。この3つを1画面で往復できる2050年人口分析を作りました。\n\n{{url}}\n\n#GIS #地域分析 #stats47',
    '2026-09-25T09:40:00+09:00'
  ),
  x(
    14,
    '県平均では市区町村差は分からない',
    'shock',
    '都道府県の平均は入口です。同じ県内の市区町村差や1kmメッシュの偏りまでは分かりません。今回は県版を公開準備し、細粒度版はデータ検証後に分けます。\n\n{{url}}\n\n#オープンデータ #人口分析 #stats47',
    '2026-09-27T08:30:00+09:00'
  ),
  x(
    15,
    '初月の検証ポイント',
    'question',
    '地図は見られただけで価値があるのか。初月は分析閲覧、地図操作、県選択、比較追加を分けて計測します。反応があったテーマだけ次の分析へ進めます。\n\n{{url}}\n\n#サイト運営 #データ分析 #stats47',
    '2026-09-29T19:30:00+09:00'
  ),
];

const NOTE_KEYS = [
  'd-geo-ipss-municipality-map',
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
  'IPSSの将来人口を地域コードで結合し、誤読を避けた地図を再現できる',
  '県・市区町村コードの欠落、桁、境界変更を公開前に検査できる',
  '洪水ポリゴンと人口メッシュの重なりを再現可能な手順で集計できる',
  '国土数値情報をQGISで読み込み、CRSと属性を検証できる',
  '地価地点と将来人口を混同せず市区町村単位で比較できる',
  '1つの地図からX画像とOGPを規約どおり派生できる',
  '人口に対する医療アクセスを距離定義つきで分析できる',
  '用途に応じてGeoPackage、Parquet、PMTilesを選べる',
  'provenance、単位、分布、coverageの品質ゲートを構築できる',
  '駅徒歩圏と将来人口を結合し、駅数との違いを説明できる',
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
      searchVisibility: 'noindex',
      acceptance: [
        '実データのある分析だけを公開可能として表示する',
        '未検証の市区町村・メッシュ分析を公開済みに見せない',
        '4分析・計測登録・thin-content監査まではナビとsitemapへ追加しない',
      ],
    },
    {
      path: ANALYSIS_PATH,
      title: '2050年人口分析',
      status: 'ready',
      searchVisibility: 'noindex',
      acceptance: [
        '47都道府県の地図・上位下位・県選択・最大3県比較を提供する',
        '出典、基準年、単位、推計の限界を常設表示する',
        '閲覧・地図操作・県選択・比較追加を別イベントで送る',
      ],
    },
    ...BUSINESS_PLAN_M1_GEO_ANALYSES.slice(1).map((analysis) => ({
      path: `/geo/${analysis.slug}`,
      title: analysis.title,
      status: analysis.status,
      searchVisibility: 'noindex' as const,
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
