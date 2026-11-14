import data from '../../../../data/geo/analyses/content-lifecycle.json';
import {
  BUSINESS_PLAN_M1_ANALYSES,
  BUSINESS_PLAN_M1_NOTE_PRODUCTS,
} from './m1';

import type {
  BusinessPlanGeoContentLifecycle,
  BusinessPlanGeoLaunchPlan,
} from './types';

/** 手で決める部分 (コンテンツごとの定義と公開ゲートの文言) の正本は台帳 `geo.content-lifecycle` (data/geo/analyses/content-lifecycle.json + Schema)。結合は下の関数が行う。 */
interface GeoContentDefinition {
  readonly themeKeys: readonly string[];
  readonly blogSlug: string;
  readonly suggestedTitle: string;
  readonly launch: BusinessPlanGeoLaunchPlan;
}

const CONTENT_DEFINITIONS = data.contents as Record<string, GeoContentDefinition>;

/** 公開ゲートの文言。全分析に共通の前段・分析の種類ごとの中段・共通の後段を台帳から読む。 */
const PUBLICATION_GATES = data.publicationGates;

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
        ...PUBLICATION_GATES.common,
        ...(analysis.analysisKind === 'spatial-cross'
          ? PUBLICATION_GATES.spatialCross
          : PUBLICATION_GATES.baseline),
        ...PUBLICATION_GATES.closing,
      ],
    };
  });
