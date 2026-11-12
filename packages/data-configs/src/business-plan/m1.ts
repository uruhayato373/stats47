import data from '../../../../data/business-plan/plan/m1.json';
import { BUSINESS_PLAN_NOTE_PRODUCTS } from './content-opportunities';
import { getGeoAnalysis, type GeoAnalysisSlug } from './geo-analyses';
import type {
  BusinessPlanM1Analysis,
  BusinessPlanM1ExecutionPlan,
  BusinessPlanM1NoteProduct,
  BusinessPlanM1Route,
  BusinessPlanM1XPost,
} from './types';

/**
 * 2026 年 9 月の M1 計画の読み込み口。記録の正本は台帳 `business-plan.m1`
 * (data/business-plan/plan/m1.json + Schema)。Geo 分析は slug の並びだけを台帳に持ち、ここで
 * getGeoAnalysis から結ぶ。note 商品の題と価格は事業計画の商品 (business-plan.content-opportunities) から結ぶ。
 */
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

export const BUSINESS_PLAN_M1_BASELINE_ANALYSIS =
  data.baselineAnalysis as BusinessPlanM1Analysis & {
    readonly analysisKind: 'baseline';
    readonly rankingKey: string;
  };

/** Geo公開面に出せる、証拠manifest付きの複数レイヤー空間分析だけを保持する。 */
export const BUSINESS_PLAN_M1_GEO_ANALYSES = (
  data.geoAnalysisSlugs as readonly GeoAnalysisSlug[]
).map((slug) => getGeoAnalysis(slug)) satisfies readonly BusinessPlanM1Analysis[];

/** X・note・横断比較では、基準ランキングを含む全4系列を参照する。 */
export const BUSINESS_PLAN_M1_ANALYSES = [
  BUSINESS_PLAN_M1_BASELINE_ANALYSIS,
  ...BUSINESS_PLAN_M1_GEO_ANALYSES,
] as const satisfies readonly BusinessPlanM1Analysis[];

/**
 * 2026年9月の初期15投稿。URL・素材のパスは台帳に最終形で書く (buildM1XCanonicalUrl の結果と一致することはテストが固定する)。
 */
export const BUSINESS_PLAN_M1_X_POSTS =
  data.xPosts as readonly BusinessPlanM1XPost[];

for (const post of BUSINESS_PLAN_M1_X_POSTS) {
  for (const analysisId of post.analysisIds) {
    if (!BUSINESS_PLAN_M1_ANALYSES.some((analysis) => analysis.id === analysisId)) {
      throw new Error(`Geo X投稿 ${post.id} の分析が未定義です: ${analysisId}`);
    }
  }
}

type RawM1NoteProduct = Omit<BusinessPlanM1NoteProduct, 'title' | 'priceYen'>;

export const BUSINESS_PLAN_M1_NOTE_PRODUCTS: readonly BusinessPlanM1NoteProduct[] = (
  data.noteProducts as readonly RawM1NoteProduct[]
).map(({ id, articleKey, ...rest }) => {
  const idea = BUSINESS_PLAN_NOTE_PRODUCTS.find((item) => item.id === id);
  if (!idea) {
    throw new Error(`M1 の note 商品が事業計画の商品にありません: ${id}`);
  }
  return { id, articleKey, title: idea.title, priceYen: idea.priceYen, ...rest };
});

type RawM1Plan = Pick<
  BusinessPlanM1ExecutionPlan,
  'month' | 'objective' | 'routes' | 'eventIds' | 'tasks' | 'releaseGates'
> & {
  /** Geo 分析ごとの公開経路 (/geo/<slug>) に共通の検索可否と受け入れ条件 */
  readonly geoAnalysisRoute: Pick<BusinessPlanM1Route, 'searchVisibility' | 'acceptance'>;
};

const PLAN = data.plan as RawM1Plan;

export const BUSINESS_PLAN_M1: BusinessPlanM1ExecutionPlan = {
  month: PLAN.month,
  objective: PLAN.objective,
  routes: [
    ...PLAN.routes,
    ...BUSINESS_PLAN_M1_GEO_ANALYSES.map((analysis) => ({
      path: `/geo/${analysis.slug}`,
      title: analysis.title,
      status: analysis.status,
      searchVisibility: PLAN.geoAnalysisRoute.searchVisibility,
      acceptance: PLAN.geoAnalysisRoute.acceptance,
    })),
  ],
  analysis: BUSINESS_PLAN_M1_BASELINE_ANALYSIS,
  analyses: BUSINESS_PLAN_M1_ANALYSES,
  xPosts: BUSINESS_PLAN_M1_X_POSTS,
  noteProducts: BUSINESS_PLAN_M1_NOTE_PRODUCTS,
  eventIds: PLAN.eventIds,
  tasks: PLAN.tasks,
  releaseGates: PLAN.releaseGates,
};
