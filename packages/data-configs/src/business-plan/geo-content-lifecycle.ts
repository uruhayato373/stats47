import { BUSINESS_PLAN_M1_GEO_ANALYSES, BUSINESS_PLAN_M1_NOTE_PRODUCTS } from './m1';

import type { BusinessPlanGeoContentLifecycle } from './types';

const CONTENT_DEFINITIONS = {
  'geo-001': {
    themeKeys: ['population-dynamics'],
    blogSlug: '2050-population-map-reading',
    suggestedTitle: '2050年、人口増は東京だけなのか',
  },
  'geo-016': {
    themeKeys: ['living-housing', 'population-dynamics', 'local-economy'],
    blogSlug: 'population-decline-land-price-divergence',
    suggestedTitle: '人口減でも地価が上がる20府県',
  },
  'geo-031': {
    themeKeys: ['safety', 'population-dynamics'],
    blogSlug: '2050-population-flood-exposure',
    suggestedTitle: '2050年も洪水区域に人口は残る',
  },
  'geo-062': {
    themeKeys: ['railway', 'labor-mobility', 'population-dynamics'],
    blogSlug: '2050-station-access-population',
    suggestedTitle: '駅近人口は2050年にどれだけ残るか',
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
