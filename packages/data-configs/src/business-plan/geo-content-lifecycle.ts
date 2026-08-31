import { BUSINESS_PLAN_M1_GEO_ANALYSES, BUSINESS_PLAN_M1_NOTE_PRODUCTS } from './m1';

import type { BusinessPlanGeoContentLifecycle } from './types';

const CONTENT_DEFINITIONS = {
  'geo-001': {
    themeKeys: ['population-dynamics'],
    blogSlug: '2050-population-map-reading',
    suggestedTitle: '2050年、人口増は東京だけなのか',
    launch: {
      order: 4,
      role: 'evidence-hub',
      audience: '統計に関心がある一般読者、学生、ライター',
      readerJob: '2050年人口の前提と地域差を短時間で把握する',
      promise:
        '単純な危機ランキングではなく、47都道府県の基準線と読み方を確認できる',
      hook: '2050年に2020年人口を上回る推計は東京都だけ',
      borrowedPatterns: [
        'GD Freakの更新日・時系列を前面に出す構成',
        'とどランの一問一答型タイトルと県別回遊',
      ],
      surfaceOrder: ['geo-canonical', 'blog', 'area', 'social', 'paid-pilot'],
      reusableOutputs: [
        '3本の空間横断分析を束ねる基準記事',
        '都道府県別の入口カード',
        '推計値の限界を説明するデータリテラシー投稿',
        '市区町村地図の再現パック',
      ],
      evaluationWindowDays: 28,
      successGate:
        'Geo3本への回遊と将来人口データの閲覧が確認できた場合だけ有料再現パックへ進む',
      stopCondition:
        '既存の将来人口記事との検索意図重複が解消できなければ単独記事を増やさず、Geoハブの解説に統合する',
    },
  },
  'geo-016': {
    themeKeys: ['living-housing', 'population-dynamics', 'local-economy'],
    blogSlug: 'population-decline-land-price-divergence',
    suggestedTitle: '人口減でも地価が上がる20府県',
    launch: {
      order: 1,
      role: 'commercial-lead',
      audience: '住まい・移住・不動産の地域差を比較したい生活者と実務者',
      readerJob: '人口減少と地価変動が逆行する地域を根拠付きで比較する',
      promise:
        '人口だけでは読めない住宅市場の地域差を、地価地点と将来人口メッシュの同一artifactで検証できる',
      hook: '人口が減るのに地価が上がる府県はどこか',
      borrowedPatterns: [
        'SNS競合の逆説を1枚で伝えるフック',
        '地理院地図のレイヤー比較と共有状態',
        'ココナラGIS商品の納品物・範囲・非対応事項の明示',
      ],
      surfaceOrder: [
        'geo-canonical',
        'blog',
        'social',
        'theme-area',
        'paid-pilot',
      ],
      reusableOutputs: [
        '根拠付き解説記事',
        '逆説・数値・地域例のSNSカード3枚',
        '住まいテーマと47県areaの導線',
        '辞書・manifest・加工済みCSV/JSONの再現パック',
        '実測後だけ検討する住宅文脈アフィリエイト',
      ],
      evaluationWindowDays: 28,
      successGate:
        'Geo閲覧・県別stage閲覧・データ導線クリックを確認した場合だけnote商品を1面で試す',
      stopCondition:
        '地点地価と府県平均の違いを説明できない、または住宅購入推奨と誤読される場合は公開しない',
    },
  },
  'geo-031': {
    themeKeys: ['safety', 'population-dynamics'],
    blogSlug: '2050-population-flood-exposure',
    suggestedTitle: '2050年も洪水区域に人口は残る',
    launch: {
      order: 2,
      role: 'public-utility',
      audience: '防災・移住・地域計画に関心がある生活者と行政実務者',
      readerJob: '将来人口と洪水浸水想定区域の重なりを県別に確認する',
      promise:
        '危険県ランキングではなく、計算対象人口・区域・途中集計・限界まで辿れる',
      hook: '人口減少後も洪水想定区域に残る人口はどれくらいか',
      borrowedPatterns: [
        'jSTAT MAPの地域レポートと再利用可能な出力',
        '地理院地図の入力・演算後レイヤー比較',
        'GD Freakの更新日・出典・地域ドリルダウン',
      ],
      surfaceOrder: ['geo-canonical', 'blog', 'area', 'social', 'paid-pilot'],
      reusableOutputs: [
        '防災テーマの検証記事',
        '47県の途中artifact閲覧導線',
        '方法・保存則・誤読防止のSNSカード',
        '加工済み県別集計と検証manifest',
      ],
      evaluationWindowDays: 28,
      successGate:
        '方法・県別stageまで読む行動とデータ閲覧が確認できた場合だけ再現パックへ進む',
      stopCondition:
        '洪水区域内人口を地域の安全・危険判定として誤読させる表現を避けられない場合は公開しない',
    },
  },
  'geo-062': {
    themeKeys: ['railway', 'labor-mobility', 'population-dynamics'],
    blogSlug: '2050-station-access-population',
    suggestedTitle: '駅近人口は2050年にどれだけ残るか',
    launch: {
      order: 3,
      role: 'decision-support',
      audience: '移住・交通・出店候補地を比較する生活者と実務者',
      readerJob: '駅800m圏と将来人口の重なりを県別に比較する',
      promise:
        '駅数ランキングではなく、駅点・距離条件・将来人口メッシュの計算過程を確認できる',
      hook: '駅が多い県ほど2050年も駅近人口が残るのか',
      borrowedPatterns: [
        'RESASの用途別メニューから分析へ入る導線',
        '商圏分析サービスの複数地点比較と提出可能な成果物',
        'uubの県選択を全表示へ反映する回遊',
      ],
      surfaceOrder: [
        'geo-canonical',
        'blog',
        'theme-area',
        'social',
        'paid-pilot',
      ],
      reusableOutputs: [
        '交通・移住の意思決定支援記事',
        '県別駅圏stageカード',
        '徒歩圏近似の限界を説明する投稿',
        '駅・メッシュ結合済み集計と辞書',
      ],
      evaluationWindowDays: 28,
      successGate:
        '比較・県別閲覧・データ導線が確認できた場合だけ用途別比較シートを商品pilotにする',
      stopCondition:
        '800m直線距離を徒歩時間・実際の到達圏として誤読させる場合は公開しない',
    },
  },
} as const;

const COMMON_GATES = [
  '公式入力の版・利用条件・SHA-256を確認する',
  '47都道府県のaggregateを欠損補完なしで生成する',
  'canonical・記事・販売物の数値を同じR2 artifactから派生する',
] as const;

export const BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE: readonly BusinessPlanGeoContentLifecycle[] =
  BUSINESS_PLAN_M1_GEO_ANALYSES.map((analysis) => {
    const content = CONTENT_DEFINITIONS[analysis.contentId];
    const paid = BUSINESS_PLAN_M1_NOTE_PRODUCTS.find((product) =>
      product.sourceContentIds.includes(analysis.contentId)
    );
    if (!content || !paid) {
      throw new Error(
        `Geoコンテンツライフサイクル定義がありません: ${analysis.contentId}`
      );
    }
    const canonicalPath = `/geo/${analysis.slug}`;
    const hasEvidenceContract =
      analysis.analysisKind === 'baseline' ||
      Boolean(analysis.evidenceManifestKey && analysis.detailR2KeyPattern);

    return {
      contentId: analysis.contentId,
      analysisId: analysis.id,
      analysisSlug: analysis.slug,
      title: analysis.title,
      themeKeys: content.themeKeys,
      launch: content.launch,
      free: {
        canonicalPath,
        dataPath:
          analysis.analysisKind === 'baseline'
            ? `/ranking/${analysis.rankingKey}`
            : `${canonicalPath}#article-data`,
        methodPath: '/geo/method',
        areaPathPattern: '/areas/{NN}',
        status: hasEvidenceContract ? 'ready' : 'gated',
      },
      editorial: {
        topicKey: `geo:${analysis.slug}`,
        blogSlug: content.blogSlug,
        blogPath: `/blog/${content.blogSlug}`,
        suggestedTitle: content.suggestedTitle,
        status: 'draft',
      },
      social: {
        campaign: analysis.contentId,
        canonicalPolicy:
          analysis.analysisKind === 'baseline'
            ? canonicalPath
            : `${canonicalPath}/{NN}/{stage}`,
        status: hasEvidenceContract ? 'ready' : 'gated',
      },
      paid: {
        productId: paid.id,
        articleKey: paid.articleKey,
        channel: 'note',
        priceYen: paid.priceYen,
        readerOutcome: paid.readerOutcome,
        deliverables: paid.deliverables,
        status: paid.status === 'in-progress' ? 'draft' : 'gated',
      },
      publicationGates: [
        ...COMMON_GATES,
        ...(analysis.analysisKind === 'spatial-cross'
          ? [
              '47県の途中artifact・lineage manifest・保存則をPASSする',
              'context-onlyレイヤーを計算入力へ混入させない',
            ]
          : ['単一指標の入口であり空間横断分析ではないと明示する']),
        '無料ページは結論、有料物は再現手順・辞書・テンプレート・加工済み成果物を提供する',
      ],
    };
  });
