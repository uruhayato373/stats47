import data from '../../../../data/geo/analyses/content-lifecycle.json';
import {
  BUSINESS_PLAN_M1_ANALYSES,
  BUSINESS_PLAN_M1_NOTE_PRODUCTS,
} from './m1';

import type {
  BusinessPlanGeoContentLifecycle,
  BusinessPlanGeoLaunchPlan,
} from './types';

/** 手で決める部分の正本は台帳 `geo.content-lifecycle` (data/geo/analyses/content-lifecycle.json + Schema)。結合は下の関数が行う。 */
interface GeoContentDefinition {
  readonly themeKeys: readonly string[];
  readonly blogSlug: string;
  readonly suggestedTitle: string;
  readonly launch: BusinessPlanGeoLaunchPlan;
}

const CONTENT_DEFINITIONS = data.contents as Record<string, GeoContentDefinition>;

const COMMON_GATES = [
  '公式入力の版・利用条件・SHA-256を確認する',
  '47都道府県のaggregateを欠損補完なしで生成する',
  'canonical・記事・販売物の数値を同じR2 artifactから派生する',
] as const;

export const BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE: readonly BusinessPlanGeoContentLifecycle[] =
  BUSINESS_PLAN_M1_ANALYSES.map((analysis) => {
    const content = CONTENT_DEFINITIONS[analysis.contentId];
    const paid = BUSINESS_PLAN_M1_NOTE_PRODUCTS.find((product) =>
      product.sourceContentIds.includes(analysis.contentId)
    );
    if (!content || !paid) {
      throw new Error(
        `Geoコンテンツライフサイクル定義がありません: ${analysis.contentId}`
      );
    }
    const canonicalPath =
      analysis.analysisKind === 'baseline'
        ? `/ranking/${analysis.rankingKey}`
        : `/geo/${analysis.slug}`;
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
