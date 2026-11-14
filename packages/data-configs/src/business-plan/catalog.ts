import catalogData from '../../../../data/business-plan/plan/catalog.json';
import decisionsData from '../../../../data/business-plan/plan/decisions.json';
import documentsData from '../../../../data/business-plan/plan/documents.json';
import eventsData from '../../../../data/business-plan/plan/events.json';
import initiativesData from '../../../../data/business-plan/plan/initiatives.json';
import metricsData from '../../../../data/business-plan/plan/metrics.json';
import pilotSpecsData from '../../../../data/business-plan/plan/pilot-specs.json';
import {
  BUSINESS_PLAN_CONTENT_OPPORTUNITIES,
  BUSINESS_PLAN_NOTE_PRODUCTS,
  BUSINESS_PLAN_X_IDEAS,
} from './content-opportunities';
import { BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE } from './geo-content-lifecycle';
import { BUSINESS_PLAN_M1 } from './m1';
import type {
  BusinessPlanCatalog,
  BusinessPlanDecision,
  BusinessPlanDocument,
  BusinessPlanEvent,
  BusinessPlanInitiative,
  BusinessPlanMetric,
  BusinessPlanPilotSpec,
} from './types';

/**
 * 事業計画カタログの読み込み口。記録の正本は台帳 `business-plan.catalog` (計画の ID・版・原本・ビジョン・原則・収益の層・重点テーマ)・`business-plan.documents`・`business-plan.decisions`・
 * `business-plan.metrics`・`business-plan.events`・`business-plan.initiatives`・`business-plan.pilot-specs`
 * (data/business-plan/plan/ の JSON + Schema)。ここは型を付けて export し、BUSINESS_PLAN_2026 を組み立てるだけ。
 */
export const BUSINESS_PLAN_DOCUMENTS =
  documentsData.documents as readonly BusinessPlanDocument[];

export const BUSINESS_PLAN_DECISIONS =
  decisionsData.decisions as readonly BusinessPlanDecision[];

export const BUSINESS_PLAN_METRICS =
  metricsData.metrics as readonly BusinessPlanMetric[];

/** KPI ツリーに載る metric (NSM → 駆動KPI → ガードレールの順)。施策とレーンが参照してよい id の集合。 */
export function buildKpiTree(metrics: readonly BusinessPlanMetric[]) {
  const order = { nsm: 0, driver: 1, guardrail: 2 } as const;
  return metrics
    .filter((metric) => metric.kpiTier)
    .map((metric) => ({
      id: metric.id,
      label: metric.label,
      tier: metric.kpiTier!,
      cadence: metric.cadence,
      measurementStatus: metric.measurementStatus,
      unit: metric.unit,
      source: metric.source,
      ...(metric.kpiTarget ? { target: metric.kpiTarget } : {}),
    }))
    .sort((a, b) => order[a.tier] - order[b.tier]);
}

export const BUSINESS_PLAN_EVENTS =
  eventsData.events as readonly BusinessPlanEvent[];

export const BUSINESS_PLAN_INITIATIVES =
  initiativesData.initiatives as readonly BusinessPlanInitiative[];

export const BUSINESS_PLAN_PILOT_SPECS =
  pilotSpecsData.pilotSpecs as readonly BusinessPlanPilotSpec[];

export const BUSINESS_PLAN_2026: BusinessPlanCatalog = {
  ...(catalogData as Pick<
    BusinessPlanCatalog,
    'id' | 'version' | 'source' | 'vision' | 'tagline' | 'principles' | 'revenueLayers' | 'priorityThemes'
  >),
  decisions: BUSINESS_PLAN_DECISIONS,
  documents: BUSINESS_PLAN_DOCUMENTS,
  metrics: BUSINESS_PLAN_METRICS,
  events: BUSINESS_PLAN_EVENTS,
  initiatives: BUSINESS_PLAN_INITIATIVES,
  pilotSpecs: BUSINESS_PLAN_PILOT_SPECS,
  contentOpportunities: BUSINESS_PLAN_CONTENT_OPPORTUNITIES,
  geoContentLifecycle: BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE,
  xIdeas: BUSINESS_PLAN_X_IDEAS,
  noteProducts: BUSINESS_PLAN_NOTE_PRODUCTS,
  m1: BUSINESS_PLAN_M1,
};
