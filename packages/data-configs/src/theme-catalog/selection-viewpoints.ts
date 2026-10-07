/**
 * テーマの指標を選ぶ視点のうち、カタログから機械で数えられるものの判定 (pure)。
 *
 * 視点の定義 (文言・重さ・確かめ方) の正本は `config/theme-selection-viewpoints.json`。
 * ここは check.kind = "machine" の規則と同じ id の関数だけを持ち、管理画面
 * (`/quality/catalog-audit`) が該当件数と該当箇所を表示する。gate ではない (warn も出さない)。
 * 既存テーマの是正候補を見える場所に並べ、提案のたびに確かめるための材料である。
 *
 * 判定は ThemeCatalog と metric config の `years` だけを読む。R2 の観測値は読まないので、
 * `years: "all"` の指標は年数が分からないものとして判定から外す (誤検知を出さない側に倒す)。
 */
import { collectChartDependencies } from './chart-dependencies';
import type { ThemeCatalog } from './types';

export const MACHINE_VIEWPOINT_IDS = [
  'card-chart-duplicate',
  'single-year-as-trend',
  'owned-elsewhere',
  'selection-evidence',
] as const;

export type MachineViewpointId = (typeof MACHINE_VIEWPOINT_IDS)[number];

export interface ViewpointHit {
  themeKey: string;
  /** 該当した chart の componentKey / metricGroup の key / 指標の rankingKey */
  target: string;
  detail: string;
}

/** metric config のうち、この判定が読む項目だけ。 */
export type ViewpointMetricRegistry = Readonly<Record<string, { years?: unknown }>>;

/**
 * metric config の `years` から年数を数える。`'all'` などは R2 を読まないと分からないため null。
 * validator の `[chart-temporal-fit]` と同じ数え方 (確実に 1 年と言えるものだけを見る)。
 */
export function metricYearCount(years: unknown): number | null {
  if (years === 'all') return null;
  if (years && typeof years === 'object') {
    const y = years as { from?: number; to?: number; years?: number[] };
    if (Array.isArray(y.years)) return y.years.length;
    if (typeof y.from === 'number' && typeof y.to === 'number') return y.to - y.from + 1;
  }
  return null;
}

const TREND_CHART_TYPES = new Set(['line-chart', 'mixed-chart']);

/** 図が描く指標の集合。全国だけを描く系列 (area: national) はカードと見せ方が違うので数えない。 */
function chartMetricKeys(chart: ThemeCatalog['charts'][number]): string[] {
  const refs = collectChartDependencies(chart).metricRefs.filter((ref) => ref.area !== 'national');
  return [...new Set(refs.map((ref) => ref.metricKey))];
}

function findCardChartDuplicates(catalogs: readonly ThemeCatalog[]): ViewpointHit[] {
  const hits: ViewpointHit[] = [];
  for (const c of catalogs) {
    for (const chart of c.charts) {
      // 構成比・ヒートマップなどはカードと違う形を見せるので、推移の図だけを比べる
      if (!TREND_CHART_TYPES.has(chart.componentType)) continue;
      const keys = chartMetricKeys(chart);
      if (keys.length === 0) continue;
      const group = (c.metricGroups ?? []).find((g) => keys.every((k) => g.rankingKeys.includes(k)));
      if (!group) continue;
      hits.push({
        themeKey: c.key,
        target: chart.componentKey,
        detail: `図「${chart.title}」の指標 ${keys.length} 件がすべてカード「${group.title}」にある`,
      });
    }
  }
  return hits;
}

function findSingleYearTrends(
  catalogs: readonly ThemeCatalog[],
  registry: ViewpointMetricRegistry
): ViewpointHit[] {
  const isSingleYear = (key: string) => metricYearCount(registry[key]?.years) === 1;
  const hits: ViewpointHit[] = [];
  for (const c of catalogs) {
    for (const chart of c.charts) {
      if (!TREND_CHART_TYPES.has(chart.componentType)) continue;
      const single = chartMetricKeys(chart).filter(isSingleYear);
      if (single.length === 0) continue;
      hits.push({
        themeKey: c.key,
        target: chart.componentKey,
        detail: `推移の図「${chart.title}」が 1 年分しかない指標を描く: ${single.join(', ')}`,
      });
    }
    for (const group of c.metricGroups ?? []) {
      if (group.comparisonYear) continue;
      if (group.rankingKeys.length === 0 || !group.rankingKeys.every(isSingleYear)) continue;
      hits.push({
        themeKey: c.key,
        target: group.key,
        detail: `カード「${group.title}」の指標がすべて 1 年分で推移を描けない (e-Stat で年を広げられるか確かめるか、comparisonYear を付けた比較カードにする)`,
      });
    }
  }
  return hits;
}

function findOwnedElsewhere(catalogs: readonly ThemeCatalog[]): ViewpointHit[] {
  const primaryOwners = new Map<string, string[]>();
  for (const c of catalogs) {
    for (const m of c.metrics) {
      if (m.role !== 'primary') continue;
      primaryOwners.set(m.rankingKey, [...(primaryOwners.get(m.rankingKey) ?? []), c.key]);
    }
  }
  const hits: ViewpointHit[] = [];
  for (const c of catalogs) {
    for (const m of c.metrics) {
      if (m.role === 'primary') continue;
      const owners = (primaryOwners.get(m.rankingKey) ?? []).filter((k) => k !== c.key);
      if (owners.length === 0) continue;
      hits.push({
        themeKey: c.key,
        target: m.rankingKey,
        detail: `${owners.join('・')} の主指標 (このテーマでは ${m.role})`,
      });
    }
  }
  return hits;
}

function findMissingSelectionEvidence(catalogs: readonly ThemeCatalog[]): ViewpointHit[] {
  const hits: ViewpointHit[] = [];
  for (const c of catalogs) {
    for (const m of c.metrics) {
      if (m.role === 'context') continue;
      if (!m.selection) {
        hits.push({ themeKey: c.key, target: m.rankingKey, detail: `${m.role} に選定根拠 (selection) が無い` });
      } else if (!m.selection.adoptionCriteria?.length) {
        hits.push({
          themeKey: c.key,
          target: m.rankingKey,
          detail: `${m.role} の選定根拠に採用基準 (adoptionCriteria) が無い`,
        });
      }
    }
  }
  return hits;
}

/** 機械で数えられる視点ごとの該当一覧。 */
export function evaluateSelectionViewpoints(
  catalogs: readonly ThemeCatalog[],
  registry: ViewpointMetricRegistry
): Record<MachineViewpointId, ViewpointHit[]> {
  return {
    'card-chart-duplicate': findCardChartDuplicates(catalogs),
    'single-year-as-trend': findSingleYearTrends(catalogs, registry),
    'owned-elsewhere': findOwnedElsewhere(catalogs),
    'selection-evidence': findMissingSelectionEvidence(catalogs),
  };
}

/** 採用基準ごとに、primary・secondary の選定根拠で挙げられた件数。 */
export function countAdoptionCriteria(catalogs: readonly ThemeCatalog[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of catalogs) {
    for (const m of c.metrics) {
      if (m.role === 'context') continue;
      for (const id of m.selection?.adoptionCriteria ?? []) counts[id] = (counts[id] ?? 0) + 1;
    }
  }
  return counts;
}
