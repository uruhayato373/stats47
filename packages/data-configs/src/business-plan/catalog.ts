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
 * 事業計画カタログの読み込み口。記録の正本は台帳 `business-plan.documents`・`business-plan.decisions`・
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
  id: 'stats47-business-plan-2026',
  version: '2026-09-01.1',
  source: {
    title: 'stats47 2.0 超具体的 事業計画書',
    subtitle: 'GIS × AI × 地域データによるstats47事業拡張計画',
    sourcePath:
      '/Users/minamidaisuke/Downloads/stats47_2_business_plan_2026.docx',
    sourceSha256:
      '04f678551e1395a2033d8d6e34e7b6029932792f61e9dd178aedaa690de510c8',
    sourcePages: 35,
    sourceCheckedAt: '2026-08-28',
    planPeriod: '2026-09〜2027-08',
    note: '売上・CVR・アクセス目標は予測ではなく意思決定用の仮説。原本はローカル参考資料であり、正典は本カタログと既存docs。',
  },
  vision:
    'ランキングを入口に、地図で理解し、データを資産化し、AIで探し、需要が確認できた領域を法人価値へつなぐ。',
  tagline: '日本の地域データを、探す・比べる・分析する。',
  principles: [
    '新ブランドを作らずstats47を拡張する',
    '最初の90日はSaaSを作らない',
    '市区町村ページを機械的に量産しない',
    '計算と空間処理は決定論的に行う',
    '無料で結論、有料で再現性・解像度・時短を提供する',
    '一次資料・方法・限界・AI利用を開示する',
  ],
  revenueLayers: ['集客', '商用意図', '知識・データ販売', '継続課金', '法人'],
  priorityThemes: [
    '人口・未来',
    '住まい・移住',
    '防災',
    '医療・生活利便',
    '交通・都市構造',
    '地域経済・商圏',
  ],
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
