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
  readonly xIdeas: readonly BusinessPlanChannelIdea[];
  readonly noteProducts: readonly BusinessPlanProductIdea[];
}
