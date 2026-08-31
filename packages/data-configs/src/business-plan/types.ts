export const BUSINESS_PLAN_DECISION_STATUSES = [
  'adopted',
  'adapted',
  'deferred',
  'rejected',
] as const;

export type BusinessPlanDecisionStatus =
  (typeof BUSINESS_PLAN_DECISION_STATUSES)[number];

export const BUSINESS_PLAN_WORK_STATUSES = [
  'ready',
  'in-progress',
  'blocked',
  'gated',
  'candidate',
] as const;

export type BusinessPlanWorkStatus =
  (typeof BUSINESS_PLAN_WORK_STATUSES)[number];

export const BUSINESS_PLAN_MEASUREMENT_STATUSES = [
  'measured',
  'partially-measured',
  'not-instrumented',
  'manual',
] as const;

export type BusinessPlanMeasurementStatus =
  (typeof BUSINESS_PLAN_MEASUREMENT_STATUSES)[number];

export interface BusinessPlanSource {
  readonly title: string;
  readonly subtitle: string;
  readonly sourcePath: string;
  readonly sourceSha256: string;
  readonly sourcePages: number;
  readonly sourceCheckedAt: string;
  readonly planPeriod: string;
  readonly note: string;
}

export interface BusinessPlanDecision {
  readonly chapter: number;
  readonly title: string;
  readonly status: BusinessPlanDecisionStatus;
  readonly summary: string;
  readonly rationale: string;
  readonly canonicalPaths: readonly string[];
  readonly owners: readonly string[];
  readonly skills: readonly string[];
  readonly metricIds: readonly string[];
}

export interface BusinessPlanDocument {
  readonly id: string;
  readonly title: string;
  readonly path: string;
  readonly role: string;
  readonly owner: string;
}

export interface BusinessPlanMetric {
  readonly id: string;
  readonly label: string;
  readonly role: 'north-star' | 'input' | 'guardrail' | 'hypothesis';
  readonly cadence: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  readonly source: string;
  readonly measurementStatus: BusinessPlanMeasurementStatus;
  readonly targetM3?: number;
  readonly targetM6?: number;
  readonly targetM12?: number;
  readonly unit: string;
  readonly note: string;
}

export interface BusinessPlanEvent {
  readonly id: string;
  readonly label: string;
  readonly canonicalEvent: string | null;
  readonly status: BusinessPlanMeasurementStatus;
  readonly owner: string;
  readonly implementationPath: string;
  readonly note: string;
}

export interface BusinessPlanInitiative {
  readonly id: string;
  readonly title: string;
  readonly wave: 'foundation' | 'pilot' | 'scale' | 'demand-gated';
  readonly status: BusinessPlanWorkStatus;
  readonly owner: string;
  readonly skills: readonly string[];
  readonly deliverables: readonly string[];
  readonly readinessGate: string;
  readonly metricIds: readonly string[];
}

export interface BusinessPlanPilotSpec {
  readonly id: string;
  readonly contentId: string;
  readonly question: string;
  readonly geography: string;
  readonly dataRefs: readonly {
    readonly kind: 'metric' | 'gis' | 'open-data';
    readonly id: string;
    readonly role: string;
  }[];
  readonly existingAssets: readonly string[];
  readonly method: readonly string[];
  readonly outputChannels: readonly string[];
  readonly qualityGates: readonly string[];
  readonly owner: string;
  readonly status: BusinessPlanWorkStatus;
}

export interface BusinessPlanContentOpportunity {
  readonly id: string;
  readonly category: string;
  readonly title: string;
  readonly geography: string;
  readonly primaryRevenue: string;
  readonly status: BusinessPlanWorkStatus;
  readonly pilotOrder?: number;
}

export type BusinessPlanGeoContentSurfaceStatus =
  | 'ready'
  | 'draft'
  | 'gated';

/**
 * 1つのGeo分析を無料閲覧だけで終わらせず、記事・テーマ・県・SNS・有料再利用物へ
 * 接続する公開ライフサイクル。数値の正典は常にcanonical Geo分析とR2 artifactに置く。
 */
export interface BusinessPlanGeoContentLifecycle {
  readonly contentId: string;
  readonly analysisId: string;
  readonly analysisSlug: string;
  readonly title: string;
  readonly themeKeys: readonly string[];
  readonly free: {
    readonly canonicalPath: string;
    readonly dataPath: string;
    readonly methodPath: '/geo/method';
    readonly areaPathPattern: '/areas/{NN}';
    readonly status: BusinessPlanGeoContentSurfaceStatus;
  };
  readonly editorial: {
    readonly topicKey: string;
    readonly blogSlug: string;
    readonly blogPath: string;
    readonly suggestedTitle: string;
    readonly status: BusinessPlanGeoContentSurfaceStatus;
  };
  readonly social: {
    readonly campaign: string;
    readonly canonicalPolicy: string;
    readonly status: BusinessPlanGeoContentSurfaceStatus;
  };
  readonly paid: {
    readonly productId: string;
    readonly articleKey: string;
    readonly channel: 'note';
    readonly priceYen: number;
    readonly readerOutcome: string;
    readonly deliverables: readonly string[];
    readonly status: BusinessPlanGeoContentSurfaceStatus;
  };
  readonly publicationGates: readonly string[];
}

export interface BusinessPlanChannelIdea {
  readonly id: string;
  readonly title: string;
  readonly format: string;
  readonly linkPolicy: string;
  readonly status: BusinessPlanWorkStatus;
}

export interface BusinessPlanProductIdea {
  readonly id: string;
  readonly month: number;
  readonly title: string;
  readonly priceYen: number;
  readonly status: BusinessPlanWorkStatus;
}

export interface BusinessPlanM1Route {
  readonly path: string;
  readonly title: string;
  readonly status: BusinessPlanWorkStatus;
  readonly searchVisibility: 'noindex' | 'index-gated' | 'index';
  readonly acceptance: readonly string[];
}

export interface BusinessPlanM1Analysis {
  readonly id: string;
  readonly contentId: string;
  readonly slug: string;
  readonly title: string;
  readonly question: string;
  /** 単一指標の入口か、複数レイヤーから導く空間分析か。 */
  readonly analysisKind: 'baseline' | 'spatial-cross';
  /** 投稿・管理画面がランキングとの違いを機械判定する入力レイヤー。 */
  readonly sourceLayers: readonly {
    readonly id: string;
    readonly label: string;
    readonly geometry: 'prefecture' | 'mesh' | 'point' | 'polygon';
    /** 計算に使う層か、説明用に並べるだけの補助層かを混在させない。 */
    readonly role: 'calculation-input' | 'context-only';
    readonly usedInCalculation: boolean;
  }[];
  /** 数値を導いた決定的処理。AIに計算・空間判定を委ねない。 */
  readonly spatialOperations: readonly string[];
  readonly primaryMetricKey: string;
  /** snapshotで配信するmetric。投稿のclaimMetricKeyはこの集合外を参照できない。 */
  readonly metricKeys: readonly string[];
  readonly rankingKey?: string;
  /** R2 配信用 snapshot。ランキングを直接読む分析では省略する。 */
  readonly r2Key?: string;
  /** 入力SHA・途中artifact・集計値のlineage。細粒度地図を配信する分析で必須。 */
  readonly evidenceManifestKey?: string;
  readonly detailR2KeyPattern?: string;
  readonly status: BusinessPlanWorkStatus;
  readonly geography: 'prefecture';
  readonly comparisonLimit: number;
  readonly expectedObservationCount: number;
  readonly dataVersion: string;
  readonly evidenceCheckedAt: string;
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly caveats: readonly string[];
}

export interface BusinessPlanM1XPost {
  readonly id: string;
  readonly contentKey: string;
  readonly title: string;
  /** 入口・複合分析・方法・意思決定を混在させない投稿クラス。 */
  readonly geoRole: 'baseline' | 'cross-analysis' | 'method' | 'decision';
  /** 投稿が根拠にする分析。複数指定は方法比較・横断導線だけに使う。 */
  readonly analysisIds: readonly string[];
  /** 地図の色と値パネルに使う、分析snapshot内の実在metric。 */
  readonly claimMetricKey: string;
  readonly template:
    | 'shock'
    | 'versus'
    | 'question'
    | 'paradox'
    | 'number'
    | 'angle-experience'
    | 'angle-howto';
  readonly caption: string;
  readonly scheduledAt: string;
  readonly canonicalUrl: string;
  readonly campaign: string;
  readonly imageKind: 'ranking-card' | 'tile-map' | 'geo-insight-card';
  readonly mediaKey: string;
  /** 投稿ごとに生成するローカルR2素材。register時はcatalog既定値より優先する。 */
  readonly mediaPath: string;
  readonly metricKeys: readonly string[];
  readonly visual: {
    readonly description: string;
    readonly mapMode:
      | 'baseline-choropleth'
      | 'derived-choropleth'
      | 'focus';
    readonly highlightAreaCodes: readonly string[];
    readonly panelKind:
      | 'selected-values'
      | 'statement'
      | 'method'
      | 'layers';
    readonly panelLabel: string;
    readonly panelItems?: readonly string[];
  };
  readonly status: BusinessPlanWorkStatus;
}

export interface BusinessPlanM1NoteProduct {
  readonly id: string;
  readonly articleKey: string;
  readonly title: string;
  readonly priceYen: number;
  readonly sourceContentIds: readonly string[];
  readonly readerOutcome: string;
  readonly deliverables: readonly string[];
  readonly status: BusinessPlanWorkStatus;
  readonly readinessGate: string;
}

export interface BusinessPlanM1Task {
  readonly id: string;
  readonly workstream:
    'site' | 'data' | 'x' | 'note' | 'measurement' | 'release';
  readonly title: string;
  readonly status: BusinessPlanWorkStatus;
  readonly owner: string;
  readonly deliverablePath: string;
  readonly doneWhen: string;
}

export interface BusinessPlanM1ExecutionPlan {
  readonly month: '2026-09';
  readonly objective: string;
  readonly routes: readonly BusinessPlanM1Route[];
  /** 後方互換の初回分析。新規実装は analyses を参照する。 */
  readonly analysis: BusinessPlanM1Analysis;
  readonly analyses: readonly BusinessPlanM1Analysis[];
  readonly xPosts: readonly BusinessPlanM1XPost[];
  readonly noteProducts: readonly BusinessPlanM1NoteProduct[];
  readonly eventIds: readonly string[];
  readonly tasks: readonly BusinessPlanM1Task[];
  readonly releaseGates: readonly string[];
}

export interface BusinessPlanCatalog {
  readonly id: string;
  readonly version: string;
  readonly source: BusinessPlanSource;
  readonly vision: string;
  readonly tagline: string;
  readonly principles: readonly string[];
  readonly revenueLayers: readonly string[];
  readonly priorityThemes: readonly string[];
  readonly decisions: readonly BusinessPlanDecision[];
  readonly documents: readonly BusinessPlanDocument[];
  readonly metrics: readonly BusinessPlanMetric[];
  readonly events: readonly BusinessPlanEvent[];
  readonly initiatives: readonly BusinessPlanInitiative[];
  readonly pilotSpecs: readonly BusinessPlanPilotSpec[];
  readonly contentOpportunities: readonly BusinessPlanContentOpportunity[];
  readonly geoContentLifecycle: readonly BusinessPlanGeoContentLifecycle[];
  readonly xIdeas: readonly BusinessPlanChannelIdea[];
  readonly noteProducts: readonly BusinessPlanProductIdea[];
  readonly m1: BusinessPlanM1ExecutionPlan;
}
